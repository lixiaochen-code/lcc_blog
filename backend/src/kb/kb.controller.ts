import { Body, Controller, Headers, Post } from "@nestjs/common";
import { AuthService } from "../auth/auth.service";
import { AccessService } from "../access/access.service";
import { ScriptRunnerService } from "../common/script-runner.service";

const actionPermissions: Record<string, string> = {
  retrieve: "notes.read",
  add: "notes.create",
  append: "notes.update",
  "update-meta": "notes.update",
  delete: "notes.delete",
  "inspect-url": "notes.read",
  "ingest-url": "kb.ingest_url",
  build: "site.build",
};

@Controller("api/kb")
export class KbController {
  constructor(
    private readonly authService: AuthService,
    private readonly accessService: AccessService,
    private readonly runner: ScriptRunnerService
  ) {}

  private async currentUser(authorization?: string) {
    const token = this.authService.extractBearerToken(authorization);
    return this.authService.authenticateByToken(token);
  }

  @Post("action")
  async action(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: { action?: string; args?: Record<string, unknown> }
  ) {
    const action = String(body.action || "").trim();
    if (!actionPermissions[action]) throw new Error(`Unsupported kb action: ${action}`);
    const actor = await this.currentUser(authorization);
    this.accessService.ensurePermission(actor, actionPermissions[action]);

    const result = action === "build"
      ? this.runner.runNodeScript("scripts/kb/build.mjs")
      : this.runner.runNodeScript("scripts/kb/agent.mjs", [
          "--action",
          action,
          ...this.runner.buildArgs(body.args || {}),
        ]);

    return {
      ok: result.ok,
      action,
      actorId: actor.id,
      result: result.payload,
      stderr: result.stderr,
    };
  }

  @Post("build")
  async build(@Headers("authorization") authorization: string | undefined) {
    const actor = await this.currentUser(authorization);
    this.accessService.ensurePermission(actor, "site.build");
    const result = this.runner.runNodeScript("scripts/kb/build.mjs");
    return {
      ok: result.ok,
      actorId: actor.id,
      result: result.payload || { ok: result.ok, message: result.ok ? "Knowledge base built." : "Build failed." },
      stderr: result.stderr,
    };
  }
}
