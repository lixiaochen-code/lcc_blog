import { Body, Controller, Headers, Post } from "@nestjs/common";
import fs from "node:fs";
import path from "node:path";
import { AuthService } from "../auth/auth.service";
import { AccessService } from "../access/access.service";
import { ScriptRunnerService } from "../common/script-runner.service";
import { ChatService } from "./chat.service";

@Controller("api")
export class ChatController {
  constructor(
    private readonly authService: AuthService,
    private readonly accessService: AccessService,
    private readonly chatService: ChatService,
    private readonly runner: ScriptRunnerService
  ) {}

  @Post("chat")
  async chat(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: { message?: string; history?: Array<{ role?: string; content?: string }> }
  ) {
    const startedAt = Date.now();
    const logPath = path.join(process.cwd(), "data", "ai-server.log");
    const log = (record: Record<string, unknown>) => {
      const line = JSON.stringify({
        time: new Date().toISOString(),
        endpoint: "/api/chat",
        ...record,
      });
      fs.appendFileSync(logPath, `${line}\n`, "utf8");
    };

    const token = this.authService.extractBearerToken(authorization);
    const actor = await this.authService.authenticateByToken(token);
    this.accessService.ensurePermission(actor, "tokens.use");

    const message = String(body.message || "").trim();
    if (!message) throw new Error("Missing chat message.");
    const history = this.chatService.normalizeHistory(body.history || []);
    const plannerStartedAt = Date.now();
    const directPlan = this.chatService.detectDirectAction(message);
    const { model: plannerModel, plan } = directPlan
      ? { model: "rule-based", plan: directPlan }
      : await this.chatService.planChatAction({ actor, message, history });
    const plannerDurationMs = Date.now() - plannerStartedAt;

    if (plan.action === "none") {
      log({
        actorId: actor.id,
        action: "none",
        plannerModel,
        plannerDurationMs,
        totalDurationMs: Date.now() - startedAt,
      });
      return {
        ok: true,
        actorId: actor.id,
        plannedBy: plannerModel,
        plan,
        executed: false,
        allowed: true,
        assistantMessage: plan.reply || "这次不需要执行知识库动作，我先直接回复你。",
      };
    }

    const permissionRequired = this.chatService.getActionPermission(plan.action);
    if (!permissionRequired) {
      throw new Error(`Unsupported planned action: ${plan.action}`);
    }
    const allowed = (actor.permissions || []).includes(permissionRequired);
    if (!allowed) {
      log({
        actorId: actor.id,
        action: plan.action,
        allowed: false,
        permissionRequired,
        plannerModel,
        plannerDurationMs,
        totalDurationMs: Date.now() - startedAt,
      });
      return {
        ok: true,
        actorId: actor.id,
        plannedBy: plannerModel,
        plan,
        executed: false,
        allowed: false,
        permissionRequired,
        assistantMessage: `我理解你的意图是执行 ${plan.action}，但你当前没有 ${permissionRequired} 权限，所以这次不能执行。`,
      };
    }

    const execution = plan.action === "build"
      ? this.runner.runNodeScript("scripts/kb/build.mjs")
      : this.runner.runNodeScript("scripts/kb/agent.mjs", [
          "--action",
          plan.action,
          ...this.runner.buildArgs(plan.args || {}),
        ]);
    const executionDurationMs = Date.now() - plannerStartedAt - plannerDurationMs;
    const executionPayload = execution.payload || { ok: execution.ok, stderr: execution.stderr };

    let assistantMessage = plan.reply || `已执行 ${plan.action}。`;
    let respondedBy = plannerModel;

    if (execution.ok) {
      const summaryStartedAt = Date.now();
      const summary = await this.chatService.summarizeActionResult({
        actor,
        message,
        plan: { action: plan.action, args: plan.args || {} },
        execution: executionPayload,
      });
      assistantMessage = summary.content || assistantMessage;
      respondedBy = summary.model || respondedBy;
      log({
        actorId: actor.id,
        action: plan.action,
        plannerModel,
        respondedBy,
        plannerDurationMs,
        executionDurationMs,
        summaryDurationMs: Date.now() - summaryStartedAt,
        executionOk: execution.ok,
        totalDurationMs: Date.now() - startedAt,
      });
    } else {
      log({
        actorId: actor.id,
        action: plan.action,
        plannerModel,
        plannerDurationMs,
        executionDurationMs,
        executionOk: execution.ok,
        totalDurationMs: Date.now() - startedAt,
      });
    }

    return {
      ok: execution.ok,
      actorId: actor.id,
      plannedBy: plannerModel,
      respondedBy,
      plan,
      executed: execution.ok,
      allowed: true,
      permissionRequired,
      result: executionPayload,
      stderr: execution.stderr,
      assistantMessage,
    };
  }
}
