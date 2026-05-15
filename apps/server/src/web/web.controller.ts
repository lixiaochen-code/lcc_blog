import { BadRequestException, Body, Controller, Post } from '@nestjs/common'
import { RequirePermissions } from '../common/decorators/require-permissions.decorator'
import { WebSearchService } from './web-search.service'
import { WebFetchService } from './web-fetch.service'
import { WebIngestService } from './web-ingest.service'

@Controller('api/web')
export class WebController {
  constructor(
    private readonly search: WebSearchService,
    private readonly fetch: WebFetchService,
    private readonly ingest: WebIngestService
  ) {}

  @Post('search')
  @RequirePermissions('ai:web')
  doSearch(@Body('query') query?: string) {
    if (!query?.trim()) throw new BadRequestException('query 不能为空')
    return this.search.search(query)
  }

  @Post('fetch')
  @RequirePermissions('ai:web')
  doFetch(@Body('url') url?: string) {
    if (!url?.trim()) throw new BadRequestException('url 不能为空')
    return this.fetch.fetch(url)
  }

  @Post('ingest')
  @RequirePermissions('ai:web', 'ai:write_kb')
  doIngest(@Body('url') url?: string) {
    if (!url?.trim()) throw new BadRequestException('url 不能为空')
    return this.ingest.ingest(url)
  }
}
