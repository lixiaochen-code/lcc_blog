import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.authService.extractBearerToken(request.headers?.authorization);
    if (!token) throw new UnauthorizedException("Not authenticated.");
    request.user = await this.authService.authenticateByToken(token);
    return true;
  }
}
