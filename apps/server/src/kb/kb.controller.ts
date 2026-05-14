import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
} from '@nestjs/common'
import { KbService } from './kb.service'
import { KbSearchService } from './kb-search.service'
import { UpsertArticleDto } from './dto/upsert-article.dto'
import { MoveArticleDto } from './dto/move-article.dto'
import { RequirePermissions } from '../common/decorators/require-permissions.decorator'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { AuditService } from '../audit/audit.service'
import type { AuthContext } from '../common/auth-context'

@Controller('api/kb')
export class KbController {
  constructor(
    private readonly kb: KbService,
    private readonly search: KbSearchService,
    private readonly audit: AuditService
  ) {}

  @Get('tree')
  @RequirePermissions('kb:view')
  tree() {
    return { items: this.kb.listTree() }
  }

  @Get('article')
  @RequirePermissions('kb:view')
  read(@Query('path') path?: string) {
    if (!path) throw new BadRequestException('path 必填')
    return this.kb.readArticle(path)
  }

  @Post('article')
  @RequirePermissions('kb:create')
  create(@Body() body: UpsertArticleDto, @CurrentUser() ctx: AuthContext) {
    const article = this.kb.writeArticle(body.path, body.content)
    this.audit.log(ctx.user.id, 'kb:create', { path: article.path })
    return article
  }

  @Put('article')
  @RequirePermissions('kb:update')
  update(@Body() body: UpsertArticleDto, @CurrentUser() ctx: AuthContext) {
    const article = this.kb.writeArticle(body.path, body.content)
    this.audit.log(ctx.user.id, 'kb:update', { path: article.path })
    return article
  }

  @Delete('article')
  @RequirePermissions('kb:delete')
  remove(@Query('path') path: string, @CurrentUser() ctx: AuthContext) {
    if (!path) throw new BadRequestException('path 必填')
    const result = this.kb.deleteArticle(path)
    this.audit.log(ctx.user.id, 'kb:delete', result)
    return result
  }

  @Post('move')
  @RequirePermissions('kb:move')
  move(@Body() body: MoveArticleDto, @CurrentUser() ctx: AuthContext) {
    const article = this.kb.moveArticle(body.from, body.to, body.title)
    this.audit.log(ctx.user.id, 'kb:move', {
      from: body.from,
      to: article.path,
    })
    return article
  }

  @Get('search')
  @RequirePermissions('kb:view')
  searchKb(@Query('q') q?: string, @Query('limit') limit?: string) {
    const items = this.search.searchByQuery(q ?? '', limit ? Number(limit) : undefined)
    return { items }
  }
}
