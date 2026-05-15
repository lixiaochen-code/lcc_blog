import { BadRequestException, Body, Controller, Get, Post } from '@nestjs/common'
import { RequirePermissions } from '../common/decorators/require-permissions.decorator'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { AiService } from './ai.service'
import type { AuthContext } from '../common/auth-context'
import type { ChatRequest, Draft } from './ai.types'

@Controller('api/ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('chat')
  @RequirePermissions('ai:use')
  chat(@Body() body: ChatRequest, @CurrentUser() ctx: AuthContext) {
    return this.ai.chat(body, ctx)
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
