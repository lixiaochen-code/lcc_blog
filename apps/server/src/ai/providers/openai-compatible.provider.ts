import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common'
import { APP_CONFIG } from '../../config/config.module'
import type { AppConfig } from '../../config/app.config'
import type {
  AiProvider,
  ProviderChatRequest,
  ProviderChatResult,
  ProviderStreamEvent,
  ProviderToolCall,
} from './provider.interface'

/**
 * OpenAI-compatible HTTP provider. Works against the public OpenAI endpoint,
 * the local 8317 proxy, and any other server that speaks the same
 * `/v1/chat/completions` JSON + SSE protocol.
 */
@Injectable()
export class OpenAiCompatibleProvider implements AiProvider {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  async chat(req: ProviderChatRequest): Promise<ProviderChatResult> {
    const res = await this.fetchCompletion({ ...req, stream: false })
    const data = (await res.json()) as Record<string, any>
    const choice = data.choices?.[0]?.message
    if (!choice) throw new ServiceUnavailableException('AI 服务返回为空')
    const toolCalls: ProviderToolCall[] = Array.isArray(choice.tool_calls)
      ? choice.tool_calls.map((c: any) => ({
          id: String(c.id),
          function: {
            name: String(c.function?.name || ''),
            arguments: String(c.function?.arguments ?? '{}'),
          },
        }))
      : []
    return { content: String(choice.content || ''), toolCalls }
  }

  async *streamChat(req: ProviderChatRequest): AsyncIterable<ProviderStreamEvent> {
    let res: Response
    try {
      res = await this.fetchCompletion({ ...req, stream: true })
    } catch (err) {
      yield { type: 'error', error: err instanceof Error ? err.message : String(err) }
      return
    }
    if (!res.body) {
      yield { type: 'error', error: 'AI 流式服务没有返回内容' }
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const packets = buffer.split('\n\n')
        buffer = packets.pop() || ''
        for (const packet of packets) {
          for (const line of packet.split('\n')) {
            const trimmed = line.trim()
            if (!trimmed.startsWith('data:')) continue
            const payload = trimmed.slice(5).trim()
            if (!payload) continue
            if (payload === '[DONE]') {
              yield { type: 'done' }
              return
            }
            try {
              const chunk = JSON.parse(payload)
              const delta = chunk.choices?.[0]?.delta?.content || ''
              if (delta) yield { type: 'delta', delta }
            } catch {
              /* skip malformed */
            }
          }
        }
      }
      yield { type: 'done' }
    } finally {
      reader.releaseLock()
    }
  }

  private async fetchCompletion(body: Record<string, any>): Promise<Response> {
    const url = `${this.config.openai.baseUrl.replace(/\/$/, '')}/chat/completions`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.openai.apiKey}`,
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new ServiceUnavailableException(
        `AI 服务请求失败：${res.status}${detail ? ` ${detail.slice(0, 200)}` : ''}`
      )
    }
    return res
  }
}
