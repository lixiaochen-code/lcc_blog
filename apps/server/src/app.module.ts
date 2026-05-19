import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ConfigModule } from './config/config.module'
import { StoreModule } from './store/store.module'
import { CommonModule } from './common/common.module'
import { AuthModule } from './auth/auth.module'
import { AuditModule } from './audit/audit.module'
import { RolesModule } from './roles/roles.module'
import { UsersModule } from './users/users.module'
import { KbModule } from './kb/kb.module'
import { WebModule } from './web/web.module'
import { McpModule } from './mcp/mcp.module'
import { AiModule } from './ai/ai.module'
import { AuthGuard } from './common/guards/auth.guard'

@Module({
  imports: [
    ConfigModule,
    StoreModule,
    CommonModule,
    AuthModule,
    AuditModule,
    RolesModule,
    UsersModule,
    KbModule,
    WebModule,
    McpModule,
    AiModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule {}
