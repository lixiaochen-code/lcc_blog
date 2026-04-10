import { Body, Controller, Get, Headers, Post } from "@nestjs/common";
import { AuthService } from "../auth/auth.service";
import { AccessService } from "./access.service";

@Controller("api/access")
export class AccessController {
  constructor(
    private readonly authService: AuthService,
    private readonly accessService: AccessService
  ) {}

  private async currentUser(authorization?: string) {
    const token = this.authService.extractBearerToken(authorization);
    return this.authService.authenticateByToken(token);
  }

  @Get()
  async inspect(@Headers("authorization") authorization?: string) {
    const currentUser = await this.currentUser(authorization);
    const users = currentUser.role === "super_admin" ? await this.accessService.allUsers() : [];
    return { ok: true, currentUser, users };
  }

  @Post("add-user")
  async addUser(@Headers("authorization") authorization: string | undefined, @Body() body: { name?: string; role?: string }) {
    const actor = await this.currentUser(authorization);
    this.accessService.ensureSuperAdmin(actor);
    const name = String(body.name || "").trim();
    if (!name) throw new Error("add-user requires name.");
    const user = await this.accessService.addUser({ name, role: body.role, approvedBy: actor.id });
    return { ok: true, result: { ok: true, action: "add-user", user } };
  }

  @Post("delete-user")
  async deleteUser(@Headers("authorization") authorization: string | undefined, @Body() body: { id?: string }) {
    const actor = await this.currentUser(authorization);
    this.accessService.ensureSuperAdmin(actor);
    const id = String(body.id || "").trim();
    const user = await this.accessService.deleteUser(id);
    return { ok: true, result: { ok: true, action: "delete-user", user } };
  }

  @Post("set-role")
  async setRole(@Headers("authorization") authorization: string | undefined, @Body() body: { id?: string; role?: string }) {
    const actor = await this.currentUser(authorization);
    this.accessService.ensureSuperAdmin(actor);
    const user = await this.accessService.setRole(String(body.id || "").trim(), String(body.role || "").trim());
    return { ok: true, result: { ok: true, action: "set-role", user } };
  }

  @Post("grant")
  async grant(@Headers("authorization") authorization: string | undefined, @Body() body: { id?: string; permission?: string }) {
    const actor = await this.currentUser(authorization);
    this.accessService.ensureSuperAdmin(actor);
    const user = await this.accessService.grant(String(body.id || "").trim(), String(body.permission || "").trim());
    return { ok: true, result: { ok: true, action: "grant", user } };
  }

  @Post("revoke")
  async revoke(@Headers("authorization") authorization: string | undefined, @Body() body: { id?: string; permission?: string }) {
    const actor = await this.currentUser(authorization);
    this.accessService.ensureSuperAdmin(actor);
    const user = await this.accessService.revoke(String(body.id || "").trim(), String(body.permission || "").trim());
    return { ok: true, result: { ok: true, action: "revoke", user } };
  }

  @Post("set-quota")
  async setQuota(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: { id?: string; dailyRequests?: number; monthlyTokens?: number }
  ) {
    const actor = await this.currentUser(authorization);
    this.accessService.ensureSuperAdmin(actor);
    const user = await this.accessService.setQuota(
      String(body.id || "").trim(),
      Number(body.dailyRequests || 20),
      Number(body.monthlyTokens || 200000)
    );
    return { ok: true, result: { ok: true, action: "set-quota", user } };
  }

  @Post("suspend")
  async suspend(@Headers("authorization") authorization: string | undefined, @Body() body: { id?: string }) {
    const actor = await this.currentUser(authorization);
    this.accessService.ensureSuperAdmin(actor);
    const user = await this.accessService.suspend(String(body.id || "").trim());
    return { ok: true, result: { ok: true, action: "suspend", user } };
  }

  @Post("activate")
  async activate(@Headers("authorization") authorization: string | undefined, @Body() body: { id?: string }) {
    const actor = await this.currentUser(authorization);
    this.accessService.ensureSuperAdmin(actor);
    const user = await this.accessService.activate(String(body.id || "").trim());
    return { ok: true, result: { ok: true, action: "activate", user } };
  }
}
