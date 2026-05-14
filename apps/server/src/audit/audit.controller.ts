import { Controller, Get, Query } from '@nestjs/common'
import { AuditService } from './audit.service'
import { RequirePermissions } from '../common/decorators/require-permissions.decorator'

@Controller('api/admin/audit')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @RequirePermissions('audit:view')
  list(@Query('limit') limit?: string) {
    return { items: this.audit.list(limit ? Number(limit) : undefined) }
  }
}
