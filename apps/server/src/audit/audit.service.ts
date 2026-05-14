import { Injectable } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { JsonStoreService } from '../store/json-store.service'

const MAX_LOG_ENTRIES = 500

@Injectable()
export class AuditService {
  constructor(private readonly store: JsonStoreService) {}

  log(actorId: string, action: string, detail: unknown = null): void {
    this.store.mutate(data => {
      data.auditLogs.unshift({
        id: randomUUID(),
        actorId,
        action,
        detail,
        createdAt: new Date().toISOString(),
      })
      data.auditLogs = data.auditLogs.slice(0, MAX_LOG_ENTRIES)
    })
  }

  list(limit = 100) {
    return this.store.read().auditLogs.slice(0, limit)
  }
}
