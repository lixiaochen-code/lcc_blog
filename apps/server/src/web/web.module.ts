import { Module } from '@nestjs/common'
import { KbModule } from '../kb/kb.module'
import { WebController } from './web.controller'
import { WebSearchService } from './web-search.service'
import { WebFetchService } from './web-fetch.service'
import { WebIngestService } from './web-ingest.service'

@Module({
  imports: [KbModule],
  controllers: [WebController],
  providers: [WebSearchService, WebFetchService, WebIngestService],
  exports: [WebSearchService, WebFetchService, WebIngestService],
})
export class WebModule {}
