import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common'
import { RolesService } from './roles.service'
import { CreateRoleDto } from './dto/create-role.dto'
import { UpdateRoleDto } from './dto/update-role.dto'
import { RequirePermissions } from '../common/decorators/require-permissions.decorator'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { PERMISSION_GROUPS } from '../common/permissions'
import type { AuthContext } from '../common/auth-context'

@Controller('api/admin')
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @Get('permissions')
  @RequirePermissions('role:assign')
  permissions() {
    return { groups: PERMISSION_GROUPS }
  }

  @Get('roles')
  @RequirePermissions('role:assign')
  list() {
    return { items: this.roles.list() }
  }

  @Post('roles')
  @RequirePermissions('role:create')
  create(@Body() body: CreateRoleDto, @CurrentUser() ctx: AuthContext) {
    return this.roles.create(body, ctx)
  }

  @Put('roles/:id')
  @RequirePermissions('role:update')
  update(@Param('id') id: string, @Body() body: UpdateRoleDto, @CurrentUser() ctx: AuthContext) {
    return this.roles.update(id, body, ctx)
  }

  @Delete('roles/:id')
  @RequirePermissions('role:delete')
  remove(@Param('id') id: string, @CurrentUser() ctx: AuthContext) {
    return this.roles.remove(id, ctx)
  }
}
