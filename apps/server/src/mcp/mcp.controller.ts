import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common'
import { RequirePermissions } from '../common/decorators/require-permissions.decorator'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import type { AuthContext } from '../common/auth-context'
import { McpService } from './mcp.service'
import { CreateMcpServerDto } from './dto/create-mcp-server.dto'
import { UpdateMcpServerDto } from './dto/update-mcp-server.dto'

@Controller('api/admin/mcp')
export class McpController {
  constructor(private readonly mcp: McpService) {}

  @Get()
  @RequirePermissions('mcp:configure')
  list() {
    return { items: this.mcp.list() }
  }

  @Post()
  @RequirePermissions('mcp:configure')
  create(@Body() body: CreateMcpServerDto, @CurrentUser() ctx: AuthContext) {
    return this.mcp.create(body, ctx)
  }

  @Put(':id')
  @RequirePermissions('mcp:configure')
  update(
    @Param('id') id: string,
    @Body() body: UpdateMcpServerDto,
    @CurrentUser() ctx: AuthContext
  ) {
    return this.mcp.update(id, body, ctx)
  }

  @Delete(':id')
  @RequirePermissions('mcp:configure')
  remove(@Param('id') id: string, @CurrentUser() ctx: AuthContext) {
    return this.mcp.remove(id, ctx)
  }
}
