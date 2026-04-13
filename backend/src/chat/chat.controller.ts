import { Body, Controller, Headers, Post, Res } from "@nestjs/common";
import type { Response } from "express";
import fs from "node:fs";
import path from "node:path";
import { AuthService } from "../auth/auth.service";
import { AccessService } from "../access/access.service";
import { ScriptRunnerService } from "../common/script-runner.service";
import { ChatService } from "./chat.service";

type ChatHistoryEntry = {
  role?: string;
  content?: string;
};

type ChatRequestBody = {
  message?: string;
  history?: ChatHistoryEntry[];
};

type ChatActor = {
  id: string;
  role: string;
  permissions?: string[];
};

type ChatPlan = {
  intent: string;
  action: string;
  args?: Record<string, unknown>;
  title: string;
  reply: string;
};

type ChatResponsePayload = {
  ok: boolean;
  actorId: string;
  plannedBy: string;
  respondedBy?: string;
  plan: ChatPlan;
  executed: boolean;
  allowed: boolean;
  permissionRequired?: string;
  result?: unknown;
  stderr?: string;
  assistantMessage: string;
};

function createRequestLogger(endpoint: string) {
  const logPath = path.join(process.cwd(), "data", "ai-server.log");
  return (record: Record<string, unknown>) => {
    const line = JSON.stringify({
      time: new Date().toISOString(),
      endpoint,
      ...record,
    });
    fs.appendFileSync(logPath, `${line}\n`, "utf8");
  };
}

function formatSseFrame(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

@Controller("api")
export class ChatController {
  constructor(
    private readonly authService: AuthService,
    private readonly accessService: AccessService,
    private readonly chatService: ChatService,
    private readonly runner: ScriptRunnerService
  ) {}

  private async authenticateActor(authorization: string | undefined) {
    const token = this.authService.extractBearerToken(authorization);
    const actor = (await this.authService.authenticateByToken(token)) as ChatActor;
    this.accessService.ensurePermission(actor as any, "tokens.use");
    return actor;
  }

  private normalizeMessage(body: ChatRequestBody) {
    const message = String(body.message || "").trim();
    if (!message) {
      throw new Error("Missing chat message.");
    }
    return message;
  }

  private resolveHistory(body: ChatRequestBody) {
    return this.chatService.normalizeHistory(body.history || []);
  }

  private async resolvePlan(actor: ChatActor, message: string, history: Array<{ role: string; content: string }>) {
    const plannerStartedAt = Date.now();
    const directPlan = this.chatService.detectDirectAction(message);
    const { model: plannerModel, plan } = directPlan
      ? { model: "rule-based", plan: directPlan }
      : await this.chatService.planChatAction({ actor, message, history });

    return {
      plannerModel,
      plan: plan as ChatPlan,
      plannerDurationMs: Date.now() - plannerStartedAt,
    };
  }

  private executePlan(plan: ChatPlan) {
    const execution = plan.action === "build"
      ? this.runner.runNodeScript("scripts/kb/build.mjs")
      : this.runner.runNodeScript("scripts/kb/agent.mjs", [
          "--action",
          plan.action,
          ...this.runner.buildArgs(plan.args || {}),
        ]);

    return {
      execution,
      executionPayload: execution.payload || { ok: execution.ok, stderr: execution.stderr },
    };
  }

  private buildExecutionFailureMessage(plan: ChatPlan, executionPayload: any, stderr: string) {
    return (
      String(executionPayload?.error || "").trim() ||
      String(stderr || "").trim() ||
      `执行 ${plan.action} 失败。`
    );
  }

  private buildFinalPayload(input: {
    ok: boolean;
    actorId: string;
    plannedBy: string;
    respondedBy?: string;
    plan: ChatPlan;
    executed: boolean;
    allowed: boolean;
    permissionRequired?: string;
    result?: unknown;
    stderr?: string;
    assistantMessage: string;
  }): ChatResponsePayload {
    return {
      ok: input.ok,
      actorId: input.actorId,
      plannedBy: input.plannedBy,
      respondedBy: input.respondedBy,
      plan: input.plan,
      executed: input.executed,
      allowed: input.allowed,
      permissionRequired: input.permissionRequired,
      result: input.result,
      stderr: input.stderr,
      assistantMessage: input.assistantMessage,
    };
  }

  @Post("chat")
  async chat(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: ChatRequestBody
  ) {
    const startedAt = Date.now();
    const log = createRequestLogger("/api/chat");
    log({
      event: "request_received",
      hasAuthorization: Boolean(authorization),
      messageLength: String(body.message || "").trim().length,
    });
    const actor = await this.authenticateActor(authorization);
    const message = this.normalizeMessage(body);
    const history = this.resolveHistory(body);
    const { plannerModel, plan, plannerDurationMs } = await this.resolvePlan(actor, message, history);

    if (plan.action === "none") {
      log({
        actorId: actor.id,
        action: "none",
        plannerModel,
        plannerDurationMs,
        totalDurationMs: Date.now() - startedAt,
      });
      return this.buildFinalPayload({
        ok: true,
        actorId: actor.id,
        plannedBy: plannerModel,
        plan,
        executed: false,
        allowed: true,
        assistantMessage: plan.reply || "这次不需要执行知识库动作，我先直接回复你。",
      });
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
      return this.buildFinalPayload({
        ok: true,
        actorId: actor.id,
        plannedBy: plannerModel,
        plan,
        executed: false,
        allowed: false,
        permissionRequired,
        assistantMessage: `我理解你的意图是执行 ${plan.action}，但你当前没有 ${permissionRequired} 权限，所以这次不能执行。`,
      });
    }

    const executionStartedAt = Date.now();
    const { execution, executionPayload } = this.executePlan(plan);
    const executionDurationMs = Date.now() - executionStartedAt;

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
        executionOk: true,
        totalDurationMs: Date.now() - startedAt,
      });
    } else {
      assistantMessage = this.buildExecutionFailureMessage(plan, executionPayload, execution.stderr);
      log({
        actorId: actor.id,
        action: plan.action,
        plannerModel,
        plannerDurationMs,
        executionDurationMs,
        executionOk: false,
        totalDurationMs: Date.now() - startedAt,
      });
    }

    return this.buildFinalPayload({
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
    });
  }

  @Post("chat/stream")
  async chatStream(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: ChatRequestBody,
    @Res() response: Response
  ) {
    const startedAt = Date.now();
    const log = createRequestLogger("/api/chat/stream");
    let heartbeat: NodeJS.Timeout | null = null;
    log({
      event: "request_received",
      hasAuthorization: Boolean(authorization),
      messageLength: String(body.message || "").trim().length,
    });

    try {
      const actor = await this.authenticateActor(authorization);
      const message = this.normalizeMessage(body);
      const history = this.resolveHistory(body);

      response.status(200);
      response.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      response.setHeader("Cache-Control", "no-cache, no-transform");
      response.setHeader("Connection", "keep-alive");
      response.setHeader("X-Accel-Buffering", "no");
      response.flushHeaders?.();

      heartbeat = setInterval(() => {
        response.write(": ping\n\n");
      }, 15000);

      const writeEvent = (event: string, data: unknown) => {
        response.write(formatSseFrame(event, data));
      };

      writeEvent("status", { phase: "received", text: "已收到请求，正在准备处理…" });
      writeEvent("status", { phase: "planning", text: "正在分析你的意图…" });

      const { plannerModel, plan, plannerDurationMs } = await this.resolvePlan(actor, message, history);

      writeEvent("plan", {
        plannedBy: plannerModel,
        plan,
      });

      if (plan.action === "none") {
        const assistantMessage = plan.reply || "这次不需要执行知识库动作，我先直接回复你。";
        writeEvent("status", { phase: "done", text: "无需执行知识库动作，已直接回复。" });
        writeEvent("message", { delta: assistantMessage });
        const finalPayload = this.buildFinalPayload({
          ok: true,
          actorId: actor.id,
          plannedBy: plannerModel,
          plan,
          executed: false,
          allowed: true,
          assistantMessage,
        });
        writeEvent("done", finalPayload);
        log({
          actorId: actor.id,
          action: "none",
          plannerModel,
          plannerDurationMs,
          totalDurationMs: Date.now() - startedAt,
        });
        return;
      }

      const permissionRequired = this.chatService.getActionPermission(plan.action);
      if (!permissionRequired) {
        throw new Error(`Unsupported planned action: ${plan.action}`);
      }

      const allowed = (actor.permissions || []).includes(permissionRequired);
      if (!allowed) {
        const assistantMessage = `我理解你的意图是执行 ${plan.action}，但你当前没有 ${permissionRequired} 权限，所以这次不能执行。`;
        writeEvent("status", { phase: "blocked", text: "当前身份没有执行该动作的权限。" });
        writeEvent("message", { delta: assistantMessage });
        const finalPayload = this.buildFinalPayload({
          ok: true,
          actorId: actor.id,
          plannedBy: plannerModel,
          plan,
          executed: false,
          allowed: false,
          permissionRequired,
          assistantMessage,
        });
        writeEvent("done", finalPayload);
        log({
          actorId: actor.id,
          action: plan.action,
          allowed: false,
          permissionRequired,
          plannerModel,
          plannerDurationMs,
          totalDurationMs: Date.now() - startedAt,
        });
        return;
      }

      writeEvent("status", {
        phase: "executing",
        text: plan.reply || `已确认动作 ${plan.action}，正在执行…`,
      });

      const executionStartedAt = Date.now();
      const { execution, executionPayload } = this.executePlan(plan);
      const executionDurationMs = Date.now() - executionStartedAt;

      let assistantMessage = plan.reply || `已执行 ${plan.action}。`;
      let respondedBy = plannerModel;

      if (!execution.ok) {
        assistantMessage = this.buildExecutionFailureMessage(plan, executionPayload, execution.stderr);
        writeEvent("status", { phase: "failed", text: `执行 ${plan.action} 失败。` });
        writeEvent("message", { delta: assistantMessage });
        const finalPayload = this.buildFinalPayload({
          ok: false,
          actorId: actor.id,
          plannedBy: plannerModel,
          respondedBy,
          plan,
          executed: false,
          allowed: true,
          permissionRequired,
          result: executionPayload,
          stderr: execution.stderr,
          assistantMessage,
        });
        writeEvent("done", finalPayload);
        log({
          actorId: actor.id,
          action: plan.action,
          plannerModel,
          plannerDurationMs,
          executionDurationMs,
          executionOk: false,
          totalDurationMs: Date.now() - startedAt,
        });
        return;
      }

      writeEvent("status", { phase: "summarizing", text: "动作已完成，正在整理回复…" });

      const summaryStartedAt = Date.now();
      let streamedSummary = "";
      let receivedSummaryChunk = false;
      try {
        for await (const chunk of this.chatService.summarizeActionResultStream({
          actor,
          message,
          plan: { action: plan.action, args: plan.args || {} },
          execution: executionPayload,
        })) {
          if (!chunk.delta) {
            continue;
          }
          receivedSummaryChunk = true;
          streamedSummary += chunk.delta;
          respondedBy = chunk.model || respondedBy;
          writeEvent("message", { delta: chunk.delta });
        }
      } catch {
        if (!receivedSummaryChunk) {
          const summary = await this.chatService.summarizeActionResult({
            actor,
            message,
            plan: { action: plan.action, args: plan.args || {} },
            execution: executionPayload,
          });
          assistantMessage = summary.content || assistantMessage;
          respondedBy = summary.model || respondedBy;
          writeEvent("message", { delta: assistantMessage });
        }
      }

      if (receivedSummaryChunk) {
        assistantMessage = streamedSummary.trim() || assistantMessage;
      }

      const summaryDurationMs = Date.now() - summaryStartedAt;
      const finalPayload = this.buildFinalPayload({
        ok: true,
        actorId: actor.id,
        plannedBy: plannerModel,
        respondedBy,
        plan,
        executed: true,
        allowed: true,
        permissionRequired,
        result: executionPayload,
        stderr: execution.stderr,
        assistantMessage,
      });

      writeEvent("status", { phase: "done", text: "已完成回复。" });
      writeEvent("done", finalPayload);
      log({
        actorId: actor.id,
        action: plan.action,
        plannerModel,
        respondedBy,
        plannerDurationMs,
        executionDurationMs,
        summaryDurationMs,
        executionOk: true,
        totalDurationMs: Date.now() - startedAt,
      });
    } catch (error: any) {
      const message = error?.message || "Request failed.";
      const status = typeof error?.getStatus === "function" ? Number(error.getStatus()) : 400;

      if (response.headersSent) {
        response.write(formatSseFrame("error", { message }));
      } else {
        response.status(status).json({ ok: false, error: message });
      }
    } finally {
      if (heartbeat) {
        clearInterval(heartbeat);
      }
      if (!response.writableEnded) {
        response.end();
      }
    }
  }
}
