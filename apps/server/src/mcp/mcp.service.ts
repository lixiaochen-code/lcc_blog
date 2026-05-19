import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { JsonStoreService } from '../store/json-store.service'
import { AuditService } from '../audit/audit.service'
import type { McpServerRecord } from '../store/store.types'
import type { AuthContext } from '../common/auth-context'
import type { CreateMcpServerDto } from './dto/create-mcp-server.dto'
import type { UpdateMcpServerDto } from './dto/update-mcp-server.dto'

const SYSTEM_MCP_ID = 'mcp_web_search'

const now = () => new Date().toISOString()

@Injectable()
export class McpService {
  constructor(
    private readonly store: JsonStoreService,
    private readonly audit: AuditService
  ) {}

  list(): McpServerRecord[] {
    return this.store.read().mcpServers
  }

  create(dto: CreateMcpServerDto, actor: AuthContext): McpServerRecord {
    const record = this.store.mutate(data => {
      if (data.mcpServers.some(item => item.name === dto.name)) {
        throw new BadRequestException('MCP 名称已存在')
      }
      const item: McpServerRecord = {
        id: randomUUID(),
        name: dto.name,
        type: dto.type,
        endpoint: dto.endpoint,
        enabled: dto.enabled ?? true,
        createdAt: now(),
        updatedAt: now(),
      }
      data.mcpServers.push(item)
      return item
    })
    this.audit.log(actor.user.id, 'mcp:create', { id: record.id, name: record.name })
    return record
  }

  update(id: string, dto: UpdateMcpServerDto, actor: AuthContext): McpServerRecord {
    const record = this.store.mutate(data => {
      const item = data.mcpServers.find(record => record.id === id)
      if (!item) throw new NotFoundException('MCP 不存在')

      if (dto.name !== undefined) item.name = dto.name
      if (dto.type !== undefined) item.type = dto.type
      if (dto.endpoint !== undefined) item.endpoint = dto.endpoint
      if (dto.enabled !== undefined) item.enabled = dto.enabled
      item.updatedAt = now()
      return item
    })
    this.audit.log(actor.user.id, 'mcp:update', { id: record.id })
    return record
  }

  remove(id: string, actor: AuthContext): { id: string } {
    this.store.mutate(data => {
      const item = data.mcpServers.find(record => record.id === id)
      if (!item) throw new NotFoundException('MCP 不存在')
      if (id === SYSTEM_MCP_ID) throw new BadRequestException('系统 MCP 不可删除')
      data.mcpServers = data.mcpServers.filter(record => record.id !== id)
    })
    this.audit.log(actor.user.id, 'mcp:delete', { id })
    return { id }
  }
}
