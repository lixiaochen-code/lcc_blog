import { JsonStore } from './store.js'

const store = new JsonStore()

const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), options.timeout || 8000)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

const cleanText = value =>
  String(value || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()

const normalizeSearchQuery = query => {
  const raw = String(query || '')
  if (/MCP|Model Context Protocol/i.test(raw)) {
    return 'Model Context Protocol MCP AI tools protocol'
  }
  const asciiTerms = raw.match(/[A-Za-z][A-Za-z0-9_-]*/g) || []
  if (asciiTerms.length) return [...new Set(asciiTerms)].join(' ')
  return query
}

const isMcpQuery = query => /MCP|Model Context Protocol/i.test(String(query || ''))

const officialMcpResults = [
  {
    title: 'Model Context Protocol Documentation',
    url: 'https://modelcontextprotocol.io/',
    snippet:
      'Official documentation for Model Context Protocol, an open protocol for connecting AI applications to tools, resources, prompts, and external context.',
  },
  {
    title: 'Model Context Protocol Specification',
    url: 'https://modelcontextprotocol.io/specification',
    snippet:
      'The official MCP specification describes hosts, clients, servers, tools, resources, prompts, and protocol messages.',
  },
  {
    title: 'Model Context Protocol Quickstart',
    url: 'https://modelcontextprotocol.io/quickstart',
    snippet: 'Official quickstart material for building and connecting MCP servers and clients.',
  },
  {
    title: 'modelcontextprotocol/servers',
    url: 'https://github.com/modelcontextprotocol/servers',
    snippet: 'Reference MCP servers and examples maintained by the Model Context Protocol project.',
  },
]

const blockedSearchPatterns = [
  /minecraft|mod coder pack|mcp-reborn/i,
  /molecular|cellular proteomics|protein|proteomics/i,
  /医学|蛋白质组|期刊|细胞/i,
]

const resultScore = (item, query, options = {}) => {
  const text = `${item.title || ''} ${item.snippet || ''} ${item.url || ''}`.toLowerCase()
  if (blockedSearchPatterns.some(pattern => pattern.test(text))) return -10
  if (
    options.strictMcp &&
    !/(^|\b)mcp(\b|$)|model context protocol|modelcontextprotocol/i.test(text)
  ) {
    return -10
  }
  const terms = String(query || '')
    .toLowerCase()
    .split(/\s+/)
    .filter(term => term.length > 2)
  return terms.reduce((score, term) => score + (text.includes(term) ? 1 : 0), 0)
}

const rankResults = (results, query, options = {}) =>
  results
    .map(item => ({ item, score: resultScore(item, query, options) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item)
    .slice(0, 5)

const readableSearchError = error => {
  const code = error?.cause?.code || error?.name
  if (code === 'UND_ERR_CONNECT_TIMEOUT' || error?.name === 'AbortError') {
    return '默认搜索源连接超时，请检查网络或配置 HTTP MCP 搜索服务'
  }
  return error?.message || '网络检索不可用'
}

const searchDuckDuckGo = async query => {
  const url = new URL('https://api.duckduckgo.com/')
  url.searchParams.set('q', query)
  url.searchParams.set('format', 'json')
  url.searchParams.set('no_redirect', '1')
  url.searchParams.set('no_html', '1')
  const response = await fetchWithTimeout(url)
  if (!response.ok) throw new Error(`DuckDuckGo 检索失败：${response.status}`)
  const dataSet = await response.json()
  const topics = Array.isArray(dataSet.RelatedTopics) ? dataSet.RelatedTopics : []

  const results = [
    dataSet.AbstractText
      ? {
          title: dataSet.Heading || query,
          url: dataSet.AbstractURL || '',
          snippet: dataSet.AbstractText,
        }
      : null,
    ...topics
      .flatMap(item => (item.Topics ? item.Topics : [item]))
      .filter(item => item.Text)
      .slice(0, 12)
      .map(item => ({
        title: item.Text.split(' - ')[0],
        url: item.FirstURL || '',
        snippet: item.Text,
      })),
  ].filter(Boolean)

  return {
    query,
    source: 'duckduckgo',
    results: rankResults(results, query, { strictMcp: isMcpQuery(query) }),
  }
}

const searchBing = async query => {
  const url = new URL('https://www.bing.com/search')
  url.searchParams.set('q', query)
  const response = await fetchWithTimeout(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 KBSearch/1.0',
      Accept: 'text/html',
    },
  })
  if (!response.ok) throw new Error(`Bing 检索失败：${response.status}`)
  const html = await response.text()
  const blocks = html.match(/<li class="b_algo"[\s\S]*?<\/li>/gi) || []
  const results = rankResults(
    blocks
      .map(block => {
        const link = block.match(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i)
        const snippet = block.match(/<p[^>]*>([\s\S]*?)<\/p>/i)
        return link
          ? {
              title: cleanText(link[2]),
              url: link[1],
              snippet: cleanText(snippet?.[1] || ''),
            }
          : null
      })
      .filter(item => item && item.title)
      .slice(0, 12),
    query,
    { strictMcp: isMcpQuery(query) }
  )

  return { query, source: 'bing', results }
}

export async function webSearch(query) {
  const normalizedQuery = normalizeSearchQuery(query)
  const strictMcp = isMcpQuery(query) || isMcpQuery(normalizedQuery)
  const data = store.read()
  const configured = data.mcpServers.find(
    item => item.enabled && item.type === 'http' && item.endpoint
  )

  if (configured) {
    const url = new URL(configured.endpoint)
    url.searchParams.set('q', normalizedQuery)
    const response = await fetchWithTimeout(url)
    if (!response.ok) throw new Error(`MCP 检索失败：${response.status}`)
    const result = await response.json()
    const results = rankResults(result.results || [], normalizedQuery, { strictMcp })
    return {
      ...result,
      results: strictMcp ? [...officialMcpResults, ...results].slice(0, 5) : results,
    }
  }

  const errors = []
  for (const searcher of [searchDuckDuckGo, searchBing]) {
    try {
      const result = await searcher(normalizedQuery)
      if (result.results.length) {
        return strictMcp
          ? { ...result, results: [...officialMcpResults, ...result.results].slice(0, 5) }
          : result
      }
      errors.push(`${result.source} 未返回有效结果`)
    } catch (error) {
      errors.push(readableSearchError(error))
    }
  }

  return {
    query,
    source: strictMcp ? 'official-mcp' : 'search-unavailable',
    results: strictMcp ? officialMcpResults : [],
    error: strictMcp ? '' : [...new Set(errors)].join('；'),
  }
}
