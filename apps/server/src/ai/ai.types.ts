import { ChatRequestDto } from './dto/chat.dto'

export type ChatRequest = ChatRequestDto

export interface Draft {
  operation: 'create' | 'update' | 'delete' | 'organize'
  path: string
  content: string
  actions?: { type: 'move'; from: string; to: string; title?: string }[]
}

export interface ToolEvent {
  name: string
  status: 'running' | 'done' | 'error'
  detail: string
}

export interface ChatResponse {
  conversationId: string
  content: string
  reasoning: string[]
  draft: Draft | null
  sources: { title: string; url: string; snippet: string }[]
}

export interface ToolTraceEntry {
  name: string
  args: unknown
  result: unknown
}
