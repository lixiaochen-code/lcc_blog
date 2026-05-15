import { Module } from '@nestjs/common'
import { KbModule } from '../kb/kb.module'
import { WebModule } from '../web/web.module'
import { AiController } from './ai.controller'
import { AiService } from './ai.service'

@Module({
  imports: [KbModule, WebModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
