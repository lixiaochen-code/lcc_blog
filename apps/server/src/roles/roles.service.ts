import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { JsonStoreService } from '../store/json-store.service'
import { AuditService } from '../audit/audit.service'
import type { RoleRecord } from '../store/store.types'
import type { AuthContext } from '../common/auth-context'
import type { CreateRoleDto } from './dto/create-role.dto'
import type { UpdateRoleDto } from './dto/update-role.dto'

const now = () => new Date().toISOString()

@Injectable()
export class RolesService {
  constructor(
    private readonly store: JsonStoreService,
    private readonly audit: AuditService
  ) {}

  list(): RoleRecord[] {
    return this.store.read().roles
  }

  create(dto: CreateRoleDto, actor: AuthContext): RoleRecord {
    const role = this.store.mutate(data => {
      if (data.roles.some(item => item.name === dto.name)) {
        throw new BadRequestException('角色名已存在')
      }
      const item: RoleRecord = {
        id: randomUUID(),
        name: dto.name,
        description: dto.description ?? '',
        permissions: dto.permissions ?? [],
        system: false,
        createdAt: now(),
        updatedAt: now(),
      }
      data.roles.push(item)
      return item
    })
    this.audit.log(actor.user.id, 'role:create', { roleId: role.id, name: role.name })
    return role
  }

  update(id: string, dto: UpdateRoleDto, actor: AuthContext): RoleRecord {
    const role = this.store.mutate(data => {
      const item = data.roles.find(record => record.id === id)
      if (!item) throw new NotFoundException('角色不存在')

      // System roles can update permissions only — name/description are fixed.
      if (item.system) {
        if (dto.name !== undefined && dto.name !== item.name) {
          throw new BadRequestException('系统角色不可改名')
        }
        if (dto.description !== undefined && dto.description !== item.description) {
          throw new BadRequestException('系统角色不可改描述')
        }
      } else {
        if (dto.name !== undefined) item.name = dto.name
        if (dto.description !== undefined) item.description = dto.description
      }
      if (dto.permissions !== undefined) item.permissions = dto.permissions
      item.updatedAt = now()
      return item
    })
    this.audit.log(actor.user.id, 'role:update', { roleId: role.id })
    return role
  }

  remove(id: string, actor: AuthContext): { id: string } {
    this.store.mutate(data => {
      const item = data.roles.find(record => record.id === id)
      if (!item) throw new NotFoundException('角色不存在')
      if (item.system) throw new BadRequestException('系统角色不可删除')
      if (data.users.some(user => user.roleIds.includes(id))) {
        throw new BadRequestException('该角色仍在使用中，请先解绑用户')
      }
      data.roles = data.roles.filter(record => record.id !== id)
    })
    this.audit.log(actor.user.id, 'role:delete', { roleId: id })
    return { id }
  }
}
