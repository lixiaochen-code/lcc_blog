import { Body, Controller, Get, Headers, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";

@Controller("api/auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  async login(@Body() body: { userId?: string; name?: string }) {
    const userId = String(body.userId || "").trim();
    const name = String(body.name || "").trim();
    if (!userId || !name) {
      throw new Error("Missing userId or name.");
    }
    const result = await this.authService.login(userId, name);
    return { ok: true, ...result };
  }

  @Get("session")
  async session(@Headers("authorization") authorization?: string) {
    const token = this.authService.extractBearerToken(authorization);
    const user = await this.authService.authenticateByToken(token);
    return { ok: true, user };
  }

  @Post("logout")
  async logout(@Headers("authorization") authorization?: string) {
    const token = this.authService.extractBearerToken(authorization);
    await this.authService.removeSession(token);
    return { ok: true };
  }
}
