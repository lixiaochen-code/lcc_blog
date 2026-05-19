import { Module } from '@nestjs/common'
import { KbModule } from '../kb/kb.module'
import { WebModule } from '../web/web.module'
import { AiController } from './ai.controller'
import { AiService } from './ai.service'
import { AI_PROVIDER } from './providers/provider.interface'
import { OpenAiCompatibleProvider } from './providers/openai-compatible.provider'
import { ToolRegistry } from './tools/tool-registry'
import { KbSearchTool } from './tools/kb-search.tool'
import { KbReadTool } from './tools/kb-read.tool'
import { CreateArticleTool } from './tools/create-article.tool'
import { ReplaceArticleTool } from './tools/replace-article.tool'
import { RenameArticleTool } from './tools/rename-article.tool'
import { DeleteArticleTool } from './tools/delete-article.tool'
import { WebSearchTool } from './tools/web-search.tool'
import { WebFetchTool } from './tools/web-fetch.tool'
import { WebIngestTool } from './tools/web-ingest.tool'
import { ProposeDraftTool } from './tools/propose-draft.tool'

@Module({
  imports: [KbModule, WebModule],
  controllers: [AiController],
  providers: [
    AiService,
    OpenAiCompatibleProvider,
    { provide: AI_PROVIDER, useExisting: OpenAiCompatibleProvider },
    ToolRegistry,
    KbSearchTool,
    KbReadTool,
    CreateArticleTool,
    ReplaceArticleTool,
    RenameArticleTool,
    DeleteArticleTool,
    WebSearchTool,
    WebFetchTool,
    WebIngestTool,
    ProposeDraftTool,
  ],
})
export class AiModule {}
