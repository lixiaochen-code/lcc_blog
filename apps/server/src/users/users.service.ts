import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { JsonStoreService } from '../store/json-store.service'
import { AuditService } from '../audit/audit.service'
import { hashPassword, randomPassword } from '../common/utils/password'
import type { UserRecord } from '../store/store.types'
import type { AuthContext } from '../common/auth-context'
import type { CreateUserDto } from './dto/create-user.dto'
import type { UpdateUserDto } from './dto/update-user.dto'

const now = () => new Date().toISOString()

export type SafeUser = Omit<UserRecord, 'passwordHash'>

const stripPassword = (user: UserRecord): SafeUser => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _passwordHash, ...rest } = user
  return rest
}

@Injectable()
export class UsersService {
  constructor(
    private readonly store: JsonStoreService,
    private readonly audit: AuditService
  ) {}

  list(): SafeUser[] {
    return this.store.read().users.map(stripPassword)
  }

  create(dto: CreateUserDto, actor: AuthContext): { user: SafeUser; password: string } {
    const password = dto.password ?? randomPassword()
    const user = this.store.mutate(data => {
      if (data.users.some(item => item.username === dto.username)) {
        throw new ConflictException('账号已存在')
      }
      const knownRoleIds = new Set(data.roles.map(role => role.id))
      const invalidRole = dto.roleIds.find(id => !knownRoleIds.has(id))
      if (invalidRole) throw new BadRequestException(`未知角色：${invalidRole}`)
      const item: UserRecord = {
        id: randomUUID(),
        username: dto.username,
        passwordHash: hashPassword(password),
        roleIds: dto.roleIds,
        disabled: false,
        createdAt: now(),
        updatedAt: now(),
      }
      data.users.push(item)
      return item
    })
    this.audit.log(actor.user.id, 'user:create', {
      userId: user.id,
      username: user.username,
    })
    return { user: stripPassword(user), password }
  }

  update(
    id: string,
    dto: UpdateUserDto,
    actor: AuthContext
  ): { user: SafeUser; password?: string } {
    const result = this.store.mutate(data => {
      const user = data.users.find(item => item.id === id)
      if (!user) throw new NotFoundException('账号不存在')

      let issuedPassword: string | undefined
      if (dto.resetPassword) {
        issuedPassword = randomPassword()
        user.passwordHash = hashPassword(issuedPassword)
      }
      if (dto.roleIds !== undefined) {
        const knownRoleIds = new Set(data.roles.map(role => role.id))
        const invalidRole = dto.roleIds.find(roleId => !knownRoleIds.has(roleId))
        if (invalidRole) throw new BadRequestException(`未知角色：${invalidRole}`)
        if (id === actor.user.id && dto.roleIds.length === 0) {
          throw new BadRequestException('不能移除自己的全部角色')
        }
        user.roleIds = dto.roleIds
      }
      if (dto.disabled !== undefined) {
        if (id === actor.user.id && dto.disabled) {
          throw new ForbiddenException('不能停用自己')
        }
        user.disabled = dto.disabled
      }
      user.updatedAt = now()
      return { user, password: issuedPassword }
    })
    this.audit.log(actor.user.id, 'user:update', {
      userId: result.user.id,
      reset: Boolean(result.password),
    })
    return { user: stripPassword(result.user), password: result.password }
  }

  remove(id: string, actor: AuthContext): { id: string } {
    if (id === actor.user.id) {
      throw new ForbiddenException('不能删除自己')
    }
    this.store.mutate(data => {
      if (!data.users.some(item => item.id === id)) {
        throw new NotFoundException('账号不存在')
      }
      data.users = data.users.filter(item => item.id !== id)
    })
    this.audit.log(actor.user.id, 'user:delete', { userId: id })
    return { id }
  }
}
