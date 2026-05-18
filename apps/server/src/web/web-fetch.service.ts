import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common'
import { cleanText, fetchWithTimeout } from './web-http.util'

export interface FetchResult {
  url: string
  title: string
  content: string
  fetchedAt: string
}

/** 2 MB hard cap on response body bytes. */
const MAX_BYTES = 2 * 1024 * 1024
/** Output text cap fed downstream (LLM context budget). */
const MAX_CONTENT_CHARS = 8000

const TITLE_RE = /<title[^>]*>([\s\S]*?)<\/title>/i

/**
 * Drop markup blocks that never carry article content: `<script>`, `<style>`,
 * `<nav>`, `<aside>`, `<footer>`, and HTML comments. Each pattern is
 * case-insensitive so `<SCRIPT>` style markup is also covered. Pure function
 * exported for unit testing.
 */
export function stripNoise(html: string): string {
  if (!html) return ''
  return String(html)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
    .replace(/<nav\b[\s\S]*?<\/nav>/gi, '')
    .replace(/<aside\b[\s\S]*?<\/aside>/gi, '')
    .replace(/<footer\b[\s\S]*?<\/footer>/gi, '')
}

/**
 * Pick the most likely article container, in this order:
 *   1. first `<main>...</main>`
 *   2. first `<article>...</article>`
 *   3. longest `<div>...</div>` block by raw markup length
 *   4. the original input (no recognisable container)
 *
 * Pure; no DOM, no jsdom. Pure function exported for unit testing.
 */
export function pickContainer(html: string): string {
  if (!html) return ''
  const main = html.match(/<main\b[\s\S]*?<\/main>/i)
  if (main) return main[0]
  const article = html.match(/<article\b[\s\S]*?<\/article>/i)
  if (article) return article[0]
  const divs = html.match(/<div\b[\s\S]*?<\/div>/gi)
  if (divs && divs.length) {
    return divs.reduce((longest, current) => (current.length > longest.length ? current : longest))
  }
  return html
}

/**
 * Strip remaining HTML tags, decode the project's entity set, and collapse
 * whitespace. Output is plain text suitable for an LLM. Length capping is
 * the caller's responsibility (see `WebFetchService.fetch`).
 *
 * Tags are replaced with spaces (not removed) so adjacent words don't fuse
 * in markup like `<p>a</p><p>b</p>`. Pure function exported for unit testing.
 */
export function stripTags(html: string): string {
  if (!html) return ''
  return cleanText(String(html).replace(/<[^>]+>/g, ' '))
}

@Injectable()
export class WebFetchService {
  /**
   * Fetch a URL with an 8 s timeout and a 2 MB body cap, then extract a
   * best-effort plain-text body.
   *
   * Errors:
   *   - `BadRequestException('非法 URL')` — invalid URL or non-http(s) scheme.
   *   - `ServiceUnavailableException('抓取失败：…')` — any HTTP non-2xx,
   *     network failure, DNS error, or abort/timeout.
   */
  async fetch(url: string): Promise<FetchResult> {
    validateUrl(url)

    let res: Response
    try {
      res = await fetchWithTimeout(url)
    } catch (err) {
      throw networkError(err)
    }

    if (!res.ok) {
      const tail = res.statusText ? ` ${res.statusText}` : ''
      throw new ServiceUnavailableException(`抓取失败：${res.status}${tail}`)
    }

    let html: string
    try {
      html = await readBoundedBody(res)
    } catch (err) {
      throw networkError(err)
    }

    const cleaned = stripNoise(html)
    const picked = pickContainer(cleaned)
    const content = stripTags(picked).slice(0, MAX_CONTENT_CHARS)
    const title = extractTitle(html)
    return { url, title, content, fetchedAt: new Date().toISOString() }
  }
}

// --- internals --------------------------------------------------------------

function validateUrl(raw: string): URL {
  let parsed: URL
  try {
    parsed = new URL(String(raw ?? ''))
  } catch {
    throw new BadRequestException('非法 URL')
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new BadRequestException('非法 URL')
  }
  return parsed
}

/**
 * Read the response body chunk-by-chunk and stop once the byte total reaches
 * `MAX_BYTES`. Hitting the cap is a graceful early-stop, not an error: we
 * return whatever has been accumulated. Decoded as UTF-8 (the only encoding
 * the project supports — non-UTF-8 pages will look mangled but won't throw).
 */
async function readBoundedBody(res: Response): Promise<string> {
  const reader = res.body?.getReader()
  if (!reader) return ''
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    if (!value) continue
    chunks.push(value)
    total += value.byteLength
    if (total >= MAX_BYTES) break
  }
  return Buffer.concat(chunks).toString('utf8')
}

function extractTitle(html: string): string {
  const match = html.match(TITLE_RE)
  if (!match) return ''
  return cleanText(match[1].replace(/<[^>]+>/g, ' '))
}

/**
 * Map `fetch` rejections (timeout / abort / DNS / connection reset) onto a
 * single 503 with a human-readable reason. Walks the `cause` chain once
 * because Node's `undici` wraps DNS failures inside a generic
 * `TypeError: fetch failed`.
 */
function networkError(err: unknown): ServiceUnavailableException {
  if (err instanceof Error) {
    const cause = (err as { cause?: unknown }).cause
    const detail = cause instanceof Error ? cause.message : err.message
    return new ServiceUnavailableException(`抓取失败：${detail}`)
  }
  return new ServiceUnavailableException(`抓取失败：${String(err)}`)
}
