import { flattenTree, readArticle } from './markdown.js'
import { config } from './config.js'
import { webSearch } from './mcp.js'

const systemPrompt = `你是一个知识库编辑助手。你只能生成草稿，不能绕过用户确认直接写入文件。
当用户要求新增、修改或整理文章时，先输出一份可继续对话迭代的 Markdown 参考草稿，不要只给空模板。
当用户要求删除文章时，说明删除目标和影响，不要生成文章内容。
回答普通问题时，优先利用当前文章、知识库目录和对话历史。`

const webSearchTool = {
  type: 'function',
  function: {
    name: 'web_search',
    description:
      '在确实需要外部、实时、网页或 URL 内容时检索网络。对基于当前文章、知识库或上一轮对话即可回答的追问，不要调用此工具。',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '面向搜索引擎的精简查询词，不要直接照抄用户的追问。',
        },
      },
      required: ['query'],
      additionalProperties: false,
    },
  },
}

const extractLatestDraft = (history = []) => {
  for (const item of [...history].reverse()) {
    const marker = String(item.content || '').match(
      /\[AI_DRAFT operation="(create|update)" path="([^"]+)"\]\s*```(?:markdown|md)?\n([\s\S]*?)```/i
    )
    if (marker) {
      return {
        operation: marker[1],
        path: marker[2],
        content: marker[3].trim(),
      }
    }
  }
  return null
}

const inferDraftIntent = (message, currentArticle, history = []) => {
  const wantsDelete = /删除|移除|delete/i.test(message)
  const wantsCreate = /新增|创建|新建|create/i.test(message)
  const wantsUpdate = /修改|更新|改写|补充|优化|update/i.test(message)
  const latestDraft = extractLatestDraft(history)
  const continuesDraft =
    latestDraft &&
    /继续|补充|完善|调整|修改|改写|优化|再|增加|加上|删掉|删除|精简|详细|扩展|改成/i.test(message)

  if (!wantsDelete && !wantsCreate && !wantsUpdate && !continuesDraft) return null

  const pathMatch = message.match(/([A-Za-z0-9_\-/\u4e00-\u9fa5]+\.md)/)
  const path = pathMatch?.[1] || latestDraft?.path || currentArticle?.path || '未命名文章.md'
  if (wantsDelete) return { operation: 'delete', path, content: '' }

  return {
    operation: wantsCreate ? 'create' : latestDraft?.operation || 'update',
    path,
    content: latestDraft?.content || '',
  }
}

const buildReasoningSummary = ({ currentArticle, articleList, search, draft, searchDecision }) => {
  const steps = []
  steps.push(
    currentArticle ? `已读取当前文章：${currentArticle.path}` : '未绑定当前文章，仅根据用户输入处理'
  )
  steps.push(`已加载知识库目录上下文：${articleList.length} 篇文章`)
  if (searchDecision === 'skipped') {
    steps.push('网络检索已允许，模型判断本轮无需调用')
  } else if (searchDecision === 'fallback-skipped') {
    steps.push('网络检索已允许，本地兜底判断本轮无需调用')
  } else if (search) {
    steps.push(
      search.error
        ? `网络检索未成功：${search.error}`
        : `已执行网络检索，获得 ${search.results?.length || 0} 条参考`
    )
  }
  if (draft) {
    steps.push(`识别为 ${draft.operation} 操作，目标路径：${draft.path}`)
    steps.push('生成可迭代参考草稿，等待用户确认后再写入 Markdown')
  } else {
    steps.push('本轮未识别到需要写入知识库的草稿操作')
  }
  return steps
}

const buildDraftInstruction = (draft, currentArticle) => {
  if (!draft) return null
  if (draft.operation === 'delete') {
    return `用户意图是删除文章：${draft.path}。请只说明删除目标、风险和确认建议，不要生成新的文章正文。`
  }

  const baseDraft = draft.content ? `\n\n上一轮可迭代草稿：\n${draft.content.slice(0, 12000)}` : ''
  const currentContent = currentArticle
    ? `\n\n当前文章原文：\n${currentArticle.content.slice(0, 12000)}`
    : ''

  return `用户意图是${draft.operation === 'create' ? '新增' : '更新'}文章：${draft.path}。
请输出一份完整、可直接作为参考的 Markdown 草稿，而不是空模板。
草稿需要吸收用户本轮要求、当前文章、上一轮草稿和必要的检索结果。
用户后续可能继续对话修改这份草稿，所以请让正文清晰、可迭代。
请把最终草稿放在一个 markdown 代码块中；代码块外可以用一两句话说明这只是参考草稿，尚未写入。${currentContent}${baseDraft}`
}

const buildMessages = ({ message, history, currentArticle, articleList, useWebSearch, draft }) =>
  [
    { role: 'system', content: systemPrompt },
    { role: 'system', content: `知识库文章列表：${articleList.map(item => item.path).join(', ')}` },
    useWebSearch
      ? {
          role: 'system',
          content:
            '用户开启了网络检索权限，这只代表你可以调用 web_search 工具。只有当当前文章、知识库目录和对话历史不足以回答，或用户明确要求查看 URL、网页、最新/外部信息时才调用。追问上一轮已检索过的对象时，优先使用对话历史，不要把追问原文拿去搜索。',
        }
      : null,
    buildDraftInstruction(draft, currentArticle)
      ? { role: 'system', content: buildDraftInstruction(draft, currentArticle) }
      : null,
    currentArticle
      ? { role: 'system', content: `当前文章：\n${currentArticle.content.slice(0, 12000)}` }
      : null,
    ...history.slice(-12),
    { role: 'user', content: message },
  ].filter(Boolean)

const parseToolArguments = value => {
  try {
    return JSON.parse(value || '{}')
  } catch {
    return {}
  }
}

const collectSources = searches => {
  const seen = new Set()
  return searches
    .flatMap(search => search.results || [])
    .filter(source => {
      const key = source.url || source.title
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 8)
}

const combineSearches = searches => {
  if (!searches.length) return null
  const results = collectSources(searches)
  const errors = searches.map(item => item.error).filter(Boolean)
  return {
    query: searches
      .map(item => item.query)
      .filter(Boolean)
      .join(' | '),
    source: searches
      .map(item => item.source)
      .filter(Boolean)
      .join(', '),
    results,
    error: errors.length ? [...new Set(errors)].join('；') : undefined,
  }
}

const shouldFallbackSearch = ({ message, history = [] }) => {
  const text = String(message || '').trim()
  const hasUrl = /https?:\/\/|www\.|github\.com/i.test(text)
  const explicitSearch =
    /搜索|检索|查一下|联网|网络|最新|官网|网页|资料|仓库|github|release|版本/i.test(text)
  const asksExternalProject = /是什么项目|主要功能|开源项目|项目.*干什么|干什么.*项目/i.test(text)
  const isShortFollowUp =
    history.length > 0 &&
    text.length <= 30 &&
    /(这个|它|该项目|主要|干什么|功能|上面|刚才|继续)/.test(text)

  if (isShortFollowUp && !hasUrl && !explicitSearch) return false
  return hasUrl || explicitSearch || asksExternalProject
}

const lastUsefulAssistantMessage = history =>
  [...history]
    .reverse()
    .find(
      item =>
        item.role === 'assistant' &&
        item.content &&
        !item.content.startsWith('已收到。我会先以草稿方式处理')
    )

const extractMarkdownBlock = content => {
  const match = String(content || '').match(/```(?:markdown|md)?\n([\s\S]*?)```/i)
  return (match?.[1] || content || '').trim()
}

const createFallbackDraftContent = ({ draft, currentArticle, message, search }) => {
  if (!draft || draft.operation === 'delete') return ''
  const title = draft.path.split('/').pop().replace(/\.md$/, '') || '未命名文章'
  const references = (search?.results || [])
    .slice(0, 5)
    .map(item => `- [${item.title}](${item.url})：${item.snippet}`)
    .join('\n')
  if (draft.content) {
    return [
      draft.content,
      '',
      '## 本轮调整',
      '',
      message,
      references ? '' : null,
      references ? '## 新增参考资料' : null,
      references || null,
    ]
      .filter(Boolean)
      .join('\n')
  }

  const existing = currentArticle?.content || ''
  return [
    `# ${title}`,
    '',
    '> 这是 AI 生成的参考草稿。你可以继续对话要求补充、删减或改写，确认后再写入知识库。',
    '',
    '## 目标',
    '',
    message,
    '',
    references ? '## 参考资料' : '',
    references,
    references ? '' : '',
    existing ? '## 当前内容基础' : '',
    existing,
    existing ? '' : '',
    '## 草稿内容',
    '',
    existing ? '请基于上面的当前内容继续迭代。' : '请继续补充正文内容。',
  ]
    .filter(item => item !== '')
    .join('\n')
}

const finalizeDraft = (draft, content) => {
  if (!draft) return null
  if (draft.operation === 'delete') return draft

  const draftContent = extractMarkdownBlock(content)
  if (!draftContent || draftContent.length < 20) return null
  return {
    operation: draft.operation,
    path: draft.path,
    content: draftContent,
  }
}

const buildFallbackContent = ({ articleList, currentArticle, draft, history, message, search }) => {
  const prefix = '当前没有配置可用的模型密钥，我先用本地兜底逻辑处理。'
  if (draft?.operation === 'delete') {
    return `${prefix}\n\n已识别到删除请求：${draft.path}。请确认这篇文章确实不再需要，确认前我不会写入或删除任何文件。`
  }
  if (draft) {
    const draftContent = createFallbackDraftContent({ draft, currentArticle, message, search })
    return `${prefix}\n\n我先整理了一版可继续迭代的参考文档草稿，确认前不会写入。\n\n\`\`\`markdown\n${draftContent}\n\`\`\``
  }

  if (search?.results?.length) {
    const refs = search.results
      .slice(0, 3)
      .map((item, index) => `${index + 1}. ${item.title}\n${item.snippet}`)
      .join('\n\n')
    return `${prefix}\n\n根据网络检索结果，可以先这样理解：\n\n${refs}${
      draft ? `\n\n同时识别到 ${draft.operation} 草稿：${draft.path}` : ''
    }`
  }

  const previous = lastUsefulAssistantMessage(history)
  if (previous) {
    const content = previous.content.replace(`${prefix}\n\n`, '')
    return `${prefix}\n\n根据上一轮对话，可以继续沿用这个结论：\n\n${content}`
  }

  return `${prefix}\n\n当前知识库共有 ${articleList.length} 篇文章。${
    draft ? `\n\n已生成 ${draft.operation} 草稿：${draft.path}` : ''
  }`
}

const fetchChatCompletion = async body => {
  const response = await fetch(`${config.openai.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.openai.apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(
      `AI 服务请求失败：${response.status}${detail ? ` ${detail.slice(0, 200)}` : ''}`
    )
  }
  return response
}

const runToolCalls = async (toolCalls, handlers) => {
  const searches = []
  const toolMessages = []

  for (const toolCall of toolCalls) {
    if (toolCall.function?.name !== 'web_search') continue
    const args = parseToolArguments(toolCall.function.arguments)
    const query = String(args.query || '').trim()
    if (!query) {
      toolMessages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify({ error: '缺少检索 query', results: [] }),
      })
      continue
    }

    handlers?.onTool?.({ name: '网络检索', status: 'running', detail: query })
    const search = await webSearch(query).catch(error => ({
      query,
      source: 'search-error',
      results: [],
      error: error.message,
    }))
    searches.push(search)
    handlers?.onTool?.({
      name: '网络检索',
      status: search.error ? 'error' : 'done',
      detail: search.error || `${search.results?.length || 0} 条参考`,
    })
    toolMessages.push({
      role: 'tool',
      tool_call_id: toolCall.id,
      content: JSON.stringify(search),
    })
  }

  return { search: combineSearches(searches), toolMessages }
}

const prepareModelRun = async (context, handlers) => {
  if (!context.useWebSearch) {
    return {
      messages: context.messages,
      reasoning: buildReasoningSummary(context),
      search: null,
      sources: [],
    }
  }

  handlers?.onTool?.({
    name: '判断是否需要网络检索',
    status: 'running',
    detail: '由模型决定是否调用',
  })
  const response = await fetchChatCompletion({
    model: config.openai.model,
    temperature: 0.2,
    messages: context.messages,
    tools: [webSearchTool],
    tool_choice: 'auto',
  })
  const data = await response.json()
  const toolChoiceMessage = data.choices?.[0]?.message || {}
  const toolCalls = toolChoiceMessage.tool_calls || []

  if (!toolCalls.length) {
    handlers?.onTool?.({
      name: '判断是否需要网络检索',
      status: 'done',
      detail: '模型判断无需检索',
    })
    const reasoning = buildReasoningSummary({ ...context, searchDecision: 'skipped' })
    return {
      directContent: toolChoiceMessage.content || 'AI 没有返回内容。',
      messages: context.messages,
      reasoning,
      search: null,
      sources: [],
    }
  }

  handlers?.onTool?.({
    name: '判断是否需要网络检索',
    status: 'done',
    detail: `模型请求 ${toolCalls.length} 次检索`,
  })
  const { search, toolMessages } = await runToolCalls(toolCalls, handlers)
  const reasoning = buildReasoningSummary({ ...context, search, searchDecision: 'used' })
  return {
    messages: [
      ...context.messages,
      {
        role: 'assistant',
        content: toolChoiceMessage.content || '',
        tool_calls: toolCalls,
      },
      ...toolMessages,
    ],
    reasoning,
    search,
    sources: search?.results || [],
  }
}

const prepareFallbackRun = async (context, handlers) => {
  let search = null
  let searchDecision = null

  if (context.useWebSearch) {
    handlers?.onTool?.({
      name: '判断是否需要网络检索',
      status: 'running',
      detail: '本地兜底判断',
    })
    if (shouldFallbackSearch(context)) {
      handlers?.onTool?.({
        name: '判断是否需要网络检索',
        status: 'done',
        detail: '本轮需要外部信息',
      })
      handlers?.onTool?.({ name: '网络检索', status: 'running', detail: context.message })
      search = await webSearch(context.message).catch(error => ({
        query: context.message,
        source: 'search-error',
        results: [],
        error: error.message,
      }))
      handlers?.onTool?.({
        name: '网络检索',
        status: search.error ? 'error' : 'done',
        detail: search.error || `${search.results?.length || 0} 条参考`,
      })
    } else {
      searchDecision = 'fallback-skipped'
      handlers?.onTool?.({
        name: '判断是否需要网络检索',
        status: 'done',
        detail: '本地兜底判断无需检索',
      })
    }
  }

  const content = buildFallbackContent({ ...context, search })
  return {
    content,
    reasoning: buildReasoningSummary({ ...context, search, searchDecision }),
    draft: finalizeDraft(context.draft, content),
    search,
    sources: search?.results || [],
  }
}

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
  const draft = inferDraftIntent(message, currentArticle, history)
  onTool?.({
    name: '识别知识库操作',
    status: 'done',
    detail: draft ? `${draft.operation}: ${draft.path}` : '普通问答',
  })

  const messages = buildMessages({
    message,
    history,
    currentArticle,
    articleList,
    useWebSearch,
    draft,
  })
  return {
    articleList,
    currentArticle,
    draft,
    messages,
    message,
    history,
    useWebSearch,
  }
}

export async function createAiReply(payload) {
  const context = await createAiContext(payload)

  if (!config.openai.apiKey) {
    const fallback = await prepareFallbackRun(context)
    return {
      content: fallback.content,
      reasoning: fallback.reasoning,
      draft: fallback.draft,
      sources: fallback.sources,
    }
  }

  const prepared = await prepareModelRun(context)
  if (prepared.directContent) {
    return {
      content: prepared.directContent,
      reasoning: prepared.reasoning,
      draft: finalizeDraft(context.draft, prepared.directContent),
      sources: prepared.sources,
    }
  }

  const response = await fetchChatCompletion({
    model: config.openai.model,
    temperature: 0.2,
    messages: prepared.messages,
  })

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || 'AI 没有返回内容。'
  return {
    content,
    reasoning: prepared.reasoning,
    draft: finalizeDraft(context.draft, content),
    sources: prepared.sources,
  }
}

export async function streamAiReply(payload, handlers) {
  const context = await createAiContext({ ...payload, onTool: handlers.onTool })

  if (!config.openai.apiKey) {
    const fallback = await prepareFallbackRun(context, handlers)
    handlers.onReasoning?.(fallback.reasoning)
    handlers.onDelta?.(fallback.content)
    handlers.onDone?.({
      content: fallback.content,
      reasoning: fallback.reasoning,
      draft: fallback.draft,
      sources: fallback.sources,
    })
    return
  }

  const prepared = await prepareModelRun(context, handlers)
  handlers.onReasoning?.(prepared.reasoning)

  if (prepared.directContent) {
    handlers.onTool?.({ name: '调用模型', status: 'done', detail: '模型已直接回答' })
    handlers.onDelta?.(prepared.directContent)
    handlers.onDone?.({
      content: prepared.directContent,
      reasoning: prepared.reasoning,
      draft: finalizeDraft(context.draft, prepared.directContent),
      sources: prepared.sources,
    })
    return
  }

  handlers.onTool?.({ name: '调用模型', status: 'running', detail: config.openai.model })
  const response = await fetchChatCompletion({
    model: config.openai.model,
    temperature: 0.2,
    stream: true,
    messages: prepared.messages,
  })

  if (!response.body) throw new Error('AI 流式服务没有返回内容')

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
  handlers.onDone?.({
    content,
    reasoning: prepared.reasoning,
    draft: finalizeDraft(context.draft, content),
    sources: prepared.sources,
  })
}
