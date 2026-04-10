import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { Response } from "express";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse() as any;
      const message = typeof payload === "string" ? payload : payload?.message || exception.message;
      response.status(status).json({ ok: false, error: Array.isArray(message) ? message.join("; ") : message });
      return;
    }

    const message = exception instanceof Error ? exception.message : "Unknown server error.";
    response.status(HttpStatus.BAD_REQUEST).json({ ok: false, error: message });
  }
}
