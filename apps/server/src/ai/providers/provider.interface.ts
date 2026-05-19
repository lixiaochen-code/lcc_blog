/**
 * Vendor-neutral interface for chat-completion providers (OpenAI-compatible,
 * Anthropic, DeepSeek, etc.). `AiService` only talks to this surface — adding
 * a new vendor means dropping in another implementation and rebinding
 * `AI_PROVIDER` in `ai.module.ts`.
 */

export interface ProviderChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  /** Present on assistant turns that requested tool calls. */
  tool_calls?: ProviderToolCall[]
  /** Present on tool-result turns. */
  tool_call_id?: string
}

export interface ProviderToolSchema {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

export interface ProviderChatRequest {
  model: string
  temperature?: number
  messages: ProviderChatMessage[]
  tools?: ProviderToolSchema[]
  tool_choice?: 'auto' | 'none'
}

export interface ProviderToolCall {
  id: string
  function: {
    name: string
    arguments: string
  }
}

export interface ProviderChatResult {
  content: string
  toolCalls: ProviderToolCall[]
}

export interface ProviderStreamEvent {
  type: 'delta' | 'done' | 'error'
  delta?: string
  error?: string
}

export interface AiProvider {
  /** One-shot chat completion. May return tool calls instead of content. */
  chat(req: ProviderChatRequest): Promise<ProviderChatResult>
  /** Streaming chat completion. Yields per-token deltas; no tool calls. */
  streamChat(req: ProviderChatRequest): AsyncIterable<ProviderStreamEvent>
}

export const AI_PROVIDER = 'AI_PROVIDER'
