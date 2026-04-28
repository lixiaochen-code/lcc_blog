import { randomUUID } from 'node:crypto'
import { flattenTree, readArticle } from './markdown.js'
import { config } from './config.js'
import { webSearch } from './mcp.js'
import { JsonStore } from './store.js'

const systemPrompt = `你是一个知识库编辑助手。你只能生成草稿，不能绕过用户确认直接写入文件。
当用户要求新增、修改、删除、完善或整理文档时，返回可直接写入知识库的完整 Markdown 草稿。
如果本轮已经识别出草稿操作，只输出 Markdown 正文，不要输出寒暄、解释、代码围栏或“后续处理”。`

const aiLogStore = new JsonStore()

const missingAiConfig = () =>
  [
    ['OPENAI_BASE_URL', config.openai.baseUrl],
    ['OPENAI_API_KEY', config.openai.apiKey],
    ['OPENAI_MODEL', config.openai.model],
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key)

const isAiConfigured = () => missingAiConfig().length === 0

const snippet = (value, length = 1200) =>
  String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, length)

const extractTitle = (path, content) => {
  const heading = String(content || '')
    .match(/^#\s+(.+)$/m)?.[1]
    ?.trim()
  return heading || path.split('/').pop().replace(/\.md$/, '') || '未命名文章'
}

const inferArticleMeta = message => {
  const normalized = String(message || '')
  const candidates = [
    { pattern: /MCP|Model Context Protocol/i, title: 'MCP 基础指南', path: 'guide/mcp.md' },
    { pattern: /Agent|智能体/i, title: 'AI Agent 基础指南', path: 'guide/ai-agent.md' },
    { pattern: /AI|大模型|模型/i, title: 'AI 基础指南', path: 'guide/ai-basics.md' },
  ]
  const matched = candidates.find(item => item.pattern.test(normalized))
  if (matched) return matched

  const explicitTitle = normalized
    .match(/(?:标题|文章名|文档名)[：:]\s*([^\n，。,.]+)/)?.[1]
    ?.trim()
  if (explicitTitle) {
    return {
      title: explicitTitle,
      path: `guide/${explicitTitle
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
        .replace(/^-|-$/g, '')}.md`,
    }
  }

  return { title: '知识库草稿', path: 'guide/draft.md' }
}

const formatSources = search => {
  const results = search?.results || []
  if (!results.length) return ''
  return results
    .slice(0, 5)
    .map(
      (item, index) =>
        `${index + 1}. ${item.title || item.url}\n   ${item.snippet || item.url || ''}`
    )
    .join('\n')
}

const createLocalDraftContent = ({ message, currentArticle, search }) => {
  const inferred = inferArticleMeta(message)
  const path = currentArticle?.path || inferred.path
  const title = currentArticle ? extractTitle(path, currentArticle.content) : inferred.title
  const existing = currentArticle?.content
    ? `\n## 原文要点\n\n${snippet(currentArticle.content, 900)}\n`
    : ''
  const sources = formatSources(search)
  const sourceBlock = sources ? `\n## 参考资料\n\n${sources}\n` : ''

  return `# ${title}

> 这是 AI 生成的知识库草稿，请在确认后写入。

## 目标

${message}
${existing}
## 建议结构

1. 背景与概念说明
2. 核心流程或关键步骤
3. 实践示例
4. 注意事项
5. 总结

## 完整草稿

围绕“${message}”，建议先用一段通俗说明建立背景，再补充核心概念、操作步骤和实践注意事项。当前模型配置不完整，因此这里生成的是本地结构化草稿；配置模型后，系统会结合当前文章、知识库目录和检索参考生成更完整的正文。
${sourceBlock}
## 后续处理

- 确认草稿方向是否符合预期。
- 根据实际业务补充项目内示例。
- 点击确认写入后再更新 Markdown 文件。
`
}

const buildFallbackContent = ({ articleList, draft, search, currentArticle }) => {
  const lines = [
    '已收到。我会先以草稿方式处理，不会直接写入文件。',
    '',
    `当前知识库共有 ${articleList.length} 篇文章。`,
  ]

  const missing = missingAiConfig()
  if (missing.length) {
    lines.push('', `当前 AI 配置不完整，缺少：${missing.join(', ')}。本次使用本地草稿模式。`)
  }

  if (search) {
    lines.push(
      '',
      search.error
        ? `网络检索未成功：${search.error}`
        : `网络检索已启用，找到 ${search.results?.length || 0} 条参考。`
    )
  }

  if (draft) {
    lines.push(
      '',
      `已生成 ${draft.operation} 草稿：${draft.path}`,
      '',
      '草稿摘要：',
      snippet(draft.content, 900)
    )
  } else if (currentArticle) {
    lines.push(
      '',
      `已读取当前文章：${currentArticle.path}`,
      '你可以继续要求“完善当前文章”或“生成完整文档”，我会生成可确认写入的草稿。'
    )
  }

  return lines.join('\n')
}

const recordAiCall = entry => {
  try {
    aiLogStore.mutate(data => {
      data.aiCallLogs ||= []
      data.aiCallLogs.unshift({
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        ...entry,
      })
      data.aiCallLogs = data.aiCallLogs.slice(0, 200)
    })
  } catch {
    // Logging must never break the chat path.
  }
}

const inferDraft = (message, currentArticle) => {
  const wantsDelete = /删除|移除|delete/i.test(message)
  const wantsCreate = /新增|创建|新建|生成.*文档|完整.*文档|create/i.test(message)
  const wantsUpdate = /修改|更新|改写|补充|优化|完善|整理|扩写|润色|生成.*完整|update/i.test(
    message
  )
  if (!wantsDelete && !wantsCreate && !wantsUpdate) return null

  const pathMatch = message.match(/([A-Za-z0-9_\-/\u4e00-\u9fa5]+\.md)/)
  const inferred = inferArticleMeta(message)
  const path = pathMatch?.[1] || currentArticle?.path || inferred.path
  if (wantsDelete) return { operation: 'delete', path, content: '' }

  return {
    operation: wantsCreate && !currentArticle ? 'create' : 'update',
    path,
    content: currentArticle?.content || createLocalDraftContent({ message, currentArticle }),
  }
}

const buildReasoningSummary = ({ currentArticle, articleList, search, draft }) => {
  const steps = []
  steps.push(
    currentArticle ? `已读取当前文章：${currentArticle.path}` : '未绑定当前文章，仅根据用户输入处理'
  )
  steps.push(`已加载知识库目录上下文：${articleList.length} 篇文章`)
  if (search) {
    steps.push(
      search.error
        ? `网络检索未成功：${search.error}`
        : `已执行网络检索，获得 ${search.results?.length || 0} 条参考`
    )
  }
  if (draft) {
    steps.push(`识别为 ${draft.operation} 操作，目标路径：${draft.path}`)
    steps.push('仅生成草稿，等待用户确认后再写入 Markdown')
  } else {
    steps.push('本轮未识别到需要写入知识库的草稿操作')
  }
  return steps
}

const buildMessages = ({ message, history, currentArticle, articleList, search, draft }) =>
  [
    { role: 'system', content: systemPrompt },
    { role: 'system', content: `知识库文章列表：${articleList.map(item => item.path).join(', ')}` },
    draft
      ? {
          role: 'system',
          content: `本轮草稿操作：${draft.operation}，目标路径：${draft.path}。请输出完整 Markdown 文档正文，作为 draft.content 写入该路径。`,
        }
      : null,
    search
      ? {
          role: 'system',
          content: `网络检索参考：\n${JSON.stringify(search.results || [], null, 2)}`,
        }
      : null,
    currentArticle
      ? { role: 'system', content: `当前文章：\n${currentArticle.content.slice(0, 12000)}` }
      : null,
    ...history.slice(-12),
    { role: 'user', content: message },
  ].filter(Boolean)

export async function createAiContext({
  message,
  history = [],
  currentPath,
  useWebSearch = false,
  onTool,
}) {
  onTool?.({ name: '读取知识库上下文', status: 'running', detail: currentPath || '未选择文章' })
  const articleList = flattenTree().slice(0, 30)
  const currentArticle = currentPath ? readArticle(currentPath) : null
  onTool?.({ name: '读取知识库上下文', status: 'done', detail: `${articleList.length} 篇文章` })

  onTool?.({ name: '识别知识库操作', status: 'running', detail: '判断是否需要生成草稿' })
  const draft = inferDraft(message, currentArticle)
  onTool?.({
    name: '识别知识库操作',
    status: 'done',
    detail: draft ? `${draft.operation}: ${draft.path}` : '普通问答',
  })

  let search = null
  if (useWebSearch) {
    onTool?.({ name: '网络检索', status: 'running', detail: message })
    search = await webSearch(message).catch(error => ({
      query: message,
      source: 'search-error',
      results: [],
      error: error.message,
    }))
    onTool?.({
      name: '网络检索',
      status: search.error ? 'error' : 'done',
      detail: search.error || `${search.results?.length || 0} 条参考`,
    })
  }

  const reasoning = buildReasoningSummary({ currentArticle, articleList, search, draft })
  const messages = buildMessages({ message, history, currentArticle, articleList, search, draft })
  const enrichedDraft =
    draft && draft.operation !== 'delete'
      ? { ...draft, content: createLocalDraftContent({ message, currentArticle, search }) }
      : draft
  return { articleList, currentArticle, draft: enrichedDraft, search, reasoning, messages }
}

export async function createAiReply(payload) {
  const startedAt = Date.now()
  const { articleList, currentArticle, draft, search, reasoning, messages } =
    await createAiContext(payload)

  if (!isAiConfigured()) {
    const content = buildFallbackContent({
      articleList,
      draft,
      search,
      currentArticle,
    })
    recordAiCall({
      type: 'chat',
      status: 'fallback',
      model: config.openai.model,
      hasApiKey: Boolean(config.openai.apiKey),
      missingConfig: missingAiConfig(),
      message: snippet(payload.message),
      currentPath: payload.currentPath || '',
      useWebSearch: Boolean(payload.useWebSearch),
      searchError: search?.error || '',
      searchResultCount: search?.results?.length || 0,
      draft: draft ? { operation: draft.operation, path: draft.path } : null,
      responsePreview: snippet(content),
      durationMs: Date.now() - startedAt,
    })
    return {
      content,
      reasoning,
      draft,
      sources: search?.results || [],
    }
  }

  const response = await fetch(`${config.openai.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.openai.apiKey}`,
    },
    body: JSON.stringify({
      model: config.openai.model,
      temperature: 0.2,
      messages,
    }),
  })

  if (!response.ok) {
    recordAiCall({
      type: 'chat',
      status: 'error',
      model: config.openai.model,
      hasApiKey: Boolean(config.openai.apiKey),
      message: snippet(payload.message),
      currentPath: payload.currentPath || '',
      useWebSearch: Boolean(payload.useWebSearch),
      searchError: search?.error || '',
      searchResultCount: search?.results?.length || 0,
      error: `AI 服务请求失败：${response.status}`,
      durationMs: Date.now() - startedAt,
    })
    throw new Error(`AI 服务请求失败：${response.status}`)
  }
  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || 'AI 没有返回内容。'
  const finalDraft = draft && draft.operation !== 'delete' ? { ...draft, content } : draft
  recordAiCall({
    type: 'chat',
    status: 'success',
    model: config.openai.model,
    hasApiKey: Boolean(config.openai.apiKey),
    message: snippet(payload.message),
    currentPath: payload.currentPath || '',
    useWebSearch: Boolean(payload.useWebSearch),
    searchError: search?.error || '',
    searchResultCount: search?.results?.length || 0,
    draft: finalDraft ? { operation: finalDraft.operation, path: finalDraft.path } : null,
    responsePreview: snippet(content),
    durationMs: Date.now() - startedAt,
  })
  return {
    content,
    reasoning,
    draft: finalDraft,
    sources: search?.results || [],
  }
}

export async function streamAiReply(payload, handlers) {
  const startedAt = Date.now()
  const context = await createAiContext({ ...payload, onTool: handlers.onTool })
  handlers.onReasoning?.(context.reasoning)

  if (!isAiConfigured()) {
    const content = buildFallbackContent(context)
    handlers.onDelta?.(content)
    recordAiCall({
      type: 'stream',
      status: 'fallback',
      model: config.openai.model,
      hasApiKey: Boolean(config.openai.apiKey),
      missingConfig: missingAiConfig(),
      message: snippet(payload.message),
      currentPath: payload.currentPath || '',
      useWebSearch: Boolean(payload.useWebSearch),
      searchError: context.search?.error || '',
      searchResultCount: context.search?.results?.length || 0,
      draft: context.draft
        ? { operation: context.draft.operation, path: context.draft.path }
        : null,
      responsePreview: snippet(content),
      durationMs: Date.now() - startedAt,
    })
    handlers.onDone?.({
      content,
      reasoning: context.reasoning,
      draft: context.draft,
      sources: context.search?.results || [],
    })
    return
  }

  handlers.onTool?.({ name: '调用模型', status: 'running', detail: config.openai.model })
  const response = await fetch(`${config.openai.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.openai.apiKey}`,
    },
    body: JSON.stringify({
      model: config.openai.model,
      temperature: 0.2,
      stream: true,
      messages: context.messages,
    }),
  })

  if (!response.ok || !response.body) {
    recordAiCall({
      type: 'stream',
      status: 'error',
      model: config.openai.model,
      hasApiKey: Boolean(config.openai.apiKey),
      message: snippet(payload.message),
      currentPath: payload.currentPath || '',
      useWebSearch: Boolean(payload.useWebSearch),
      searchError: context.search?.error || '',
      searchResultCount: context.search?.results?.length || 0,
      error: `AI 流式服务请求失败：${response.status}`,
      durationMs: Date.now() - startedAt,
    })
    throw new Error(`AI 流式服务请求失败：${response.status}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let content = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const packets = buffer.split('\n\n')
    buffer = packets.pop() || ''

    for (const packet of packets) {
      const lines = packet
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('data:'))
        .map(line => line.slice(5).trim())
      for (const line of lines) {
        if (!line || line === '[DONE]') continue
        const chunk = JSON.parse(line)
        const delta = chunk.choices?.[0]?.delta?.content || ''
        if (!delta) continue
        content += delta
        handlers.onDelta?.(delta)
      }
    }
  }

  handlers.onTool?.({ name: '调用模型', status: 'done', detail: '流式响应完成' })
  const finalDraft =
    context.draft && context.draft.operation !== 'delete'
      ? { ...context.draft, content }
      : context.draft
  recordAiCall({
    type: 'stream',
    status: 'success',
    model: config.openai.model,
    hasApiKey: Boolean(config.openai.apiKey),
    message: snippet(payload.message),
    currentPath: payload.currentPath || '',
    useWebSearch: Boolean(payload.useWebSearch),
    searchError: context.search?.error || '',
    searchResultCount: context.search?.results?.length || 0,
    draft: finalDraft ? { operation: finalDraft.operation, path: finalDraft.path } : null,
    responsePreview: snippet(content),
    durationMs: Date.now() - startedAt,
  })
  handlers.onDone?.({
    content,
    reasoning: context.reasoning,
    draft: finalDraft,
    sources: context.search?.results || [],
  })
}
