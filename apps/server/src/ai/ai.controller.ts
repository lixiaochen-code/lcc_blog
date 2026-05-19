import { BadRequestException, Body, Controller, Get, Post, Res } from '@nestjs/common'
import type { Response } from 'express'
import { RequirePermissions } from '../common/decorators/require-permissions.decorator'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { AiService } from './ai.service'
import type { AuthContext } from '../common/auth-context'
import type { Draft } from './ai.types'
import { ChatRequestDto } from './dto/chat.dto'

@Controller('api/ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  /** @deprecated UI uses `chat/stream`. Kept for back-compat. */
  @Post('chat')
  @RequirePermissions('ai:use')
  chat(@Body() body: ChatRequestDto, @CurrentUser() ctx: AuthContext) {
    return this.ai.chat(body, ctx)
  }

  @Post('chat/stream')
  @RequirePermissions('ai:use')
  chatStream(
    @Body() body: ChatRequestDto,
    @CurrentUser() ctx: AuthContext,
    @Res() res: Response
  ): Promise<void> {
    return this.ai.chatStream(body, ctx, res)
  }

  @Post('apply')
  @RequirePermissions('ai:write_kb')
  apply(@Body('draft') draft: Draft, @CurrentUser() ctx: AuthContext) {
    if (!draft?.operation) throw new BadRequestException('draft 不能为空')
    return this.ai.applyDraft(draft, ctx)
  }

  @Get('conversations')
  @RequirePermissions('ai:use')
  conversations(@CurrentUser() ctx: AuthContext) {
    return { items: this.ai.listConversations(ctx) }
  }
}
