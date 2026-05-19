import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import type { Response } from 'express'

interface ErrorBody {
  statusCode: number
  message: string | string[]
  error?: string
}

/**
 * Global error formatter. Normalises every uncaught error into
 * `{ statusCode, message, error? }` — the shape `apps/kb-web/src/api.ts`
 * already parses. Skips when the response is already streaming (e.g. SSE
 * handlers manage their own `event: error` frames).
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const res = ctx.getResponse<Response>()

    // SSE / partial-write protection: the stream handler has already
    // committed headers and is emitting `event: error`. Touching `res`
    // again here would corrupt the SSE frame format.
    if (res.headersSent || res.writableEnded) return

    if (exception instanceof HttpException) {
      const status = exception.getStatus()
      const raw = exception.getResponse()
      const body: ErrorBody =
        typeof raw === 'string'
          ? { statusCode: status, message: raw }
          : this.normalize(raw as Record<string, unknown>, status)
      res.status(status).json(body)
      return
    }

    this.logger.error(exception instanceof Error ? exception.stack : String(exception))
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: '服务器内部错误',
    })
  }

  private normalize(raw: Record<string, unknown>, fallbackStatus: number): ErrorBody {
    const statusCode = typeof raw.statusCode === 'number' ? raw.statusCode : fallbackStatus
    const message = Array.isArray(raw.message)
      ? (raw.message as string[])
      : typeof raw.message === 'string'
        ? raw.message
        : '请求失败'
    const error = typeof raw.error === 'string' ? raw.error : undefined
    return { statusCode, message, error }
  }
}
