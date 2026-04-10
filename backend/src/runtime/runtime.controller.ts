import { Body, Controller, Get, Headers, Post } from "@nestjs/common";
import { AuthService } from "../auth/auth.service";
import { AccessService } from "../access/access.service";
import { RuntimeService } from "./runtime.service";

@Controller("api/runtime-config")
export class RuntimeController {
  constructor(
    private readonly authService: AuthService,
    private readonly accessService: AccessService,
    private readonly runtimeService: RuntimeService
  ) {}

  private async ensureSuperAdmin(authorization?: string) {
    const token = this.authService.extractBearerToken(authorization);
    const user = await this.authService.authenticateByToken(token);
    this.accessService.ensureSuperAdmin(user);
    return user;
  }

  @Get()
  async getRuntime(@Headers("authorization") authorization?: string) {
    await this.ensureSuperAdmin(authorization);
    const config = await this.runtimeService.getConfig();
    return { ok: true, config: this.runtimeService.sanitize(config) };
  }

  @Post()
  async setRuntime(@Headers("authorization") authorization: string | undefined, @Body() body: Record<string, unknown>) {
    await this.ensureSuperAdmin(authorization);
    const config = await this.runtimeService.setConfig(body);
    return {
      ok: true,
      result: {
        ok: true,
        action: "set",
        config: this.runtimeService.sanitize(config),
        source: "sqlite",
      },
      stderr: "",
    };
  }
}
