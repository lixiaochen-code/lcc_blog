import { Module } from '@nestjs/common'
import { KbController } from './kb.controller'
import { KbService } from './kb.service'
import { KbSearchService } from './kb-search.service'

@Module({
  controllers: [KbController],
  providers: [KbService, KbSearchService],
  exports: [KbService, KbSearchService],
})
export class KbModule {}
