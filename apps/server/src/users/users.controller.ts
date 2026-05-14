import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common'
import { UsersService } from './users.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { RequirePermissions } from '../common/decorators/require-permissions.decorator'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import type { AuthContext } from '../common/auth-context'

@Controller('api/admin/users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @RequirePermissions('user:update')
  list() {
    return { items: this.users.list() }
  }

  @Post()
  @RequirePermissions('user:create')
  create(@Body() body: CreateUserDto, @CurrentUser() ctx: AuthContext) {
    return this.users.create(body, ctx)
  }

  @Put(':id')
  @RequirePermissions('user:update')
  update(@Param('id') id: string, @Body() body: UpdateUserDto, @CurrentUser() ctx: AuthContext) {
    return this.users.update(id, body, ctx)
  }

  @Delete(':id')
  @RequirePermissions('user:delete')
  remove(@Param('id') id: string, @CurrentUser() ctx: AuthContext) {
    return this.users.remove(id, ctx)
  }
}
