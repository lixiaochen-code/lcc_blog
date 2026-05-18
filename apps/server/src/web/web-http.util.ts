/**
 * Pure utilities shared by `web-search` / `web-fetch` (and later, MCP adapters).
 *
 * Kept dependency-free on purpose:
 *   - `fetchWithTimeout` uses the platform `fetch` + `AbortController`.
 *   - `decodeEntities` / `cleanText` are pure string functions; no jsdom,
 *     readability, cheerio, or lodash.
 */

export interface FetchWithTimeoutInit extends RequestInit {
  /** Optional per-request override; default 8000 ms. */
  timeoutMs?: number
}

/**
 * Default outbound headers. Callers may override any of these by passing
 * `init.headers`; those values win.
 */
const DEFAULT_HEADERS: Readonly<Record<string, string>> = Object.freeze({
  'User-Agent': 'KBFetch/1.0',
  'Accept-Language': 'zh-CN,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate',
})

/**
 * `fetch` with an `AbortController`-backed timeout and the project's default
 * outbound headers. The timer is always cleared, even when the request rejects.
 *
 * @param url        target URL (string or `URL`)
 * @param init       standard `RequestInit`; `headers` are merged on top of the
 *                   defaults so callers can selectively override
 * @param timeoutMs  abort timeout in milliseconds; defaults to 8000
 */
export async function fetchWithTimeout(
  url: string | URL,
  init: FetchWithTimeoutInit = {},
  timeoutMs = 8000
): Promise<Response> {
  const { timeoutMs: timeoutOverride, headers: callerHeaders, ...rest } = init
  const effectiveTimeout = typeof timeoutOverride === 'number' ? timeoutOverride : timeoutMs

  const controller = new AbortController()
  const signal = init.signal ? composeSignals(init.signal, controller.signal) : controller.signal

  const merged = mergeHeaders(DEFAULT_HEADERS, callerHeaders)

  const timer = setTimeout(() => controller.abort(), effectiveTimeout)
  try {
    return await fetch(url, { ...rest, headers: merged, signal })
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Decode the small set of HTML entities the project actually encounters:
 *   - named: `&amp; &lt; &gt; &quot; &#39; &nbsp;`
 *   - numeric decimal: `&#NNN;`
 *   - numeric hexadecimal: `&#xHH;` / `&#XHH;`
 *
 * Anything else passes through unchanged. This is intentionally smaller than a
 * full HTML5 entity table — that's what `cheerio` is for, and we don't want it.
 */
export function decodeEntities(html: string): string {
  if (!html) return ''
  return String(html)
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, hex: string) => safeFromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_m, dec: string) => safeFromCodePoint(parseInt(dec, 10)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

/**
 * Normalise a free-form text fragment: decode the entity set above, collapse
 * any run of whitespace (incl. tabs / newlines / NBSP-as-space) into a single
 * space, and trim. Does NOT strip HTML tags — call `stripTags` first if the
 * input still contains markup. Keeping it pure makes it reusable from both
 * web-fetch (post-strip) and web-search (post-tag-strip).
 */
export function cleanText(input: unknown): string {
  if (input === null || input === undefined) return ''
  return decodeEntities(String(input)).replace(/\s+/g, ' ').trim()
}

// --- internals --------------------------------------------------------------

function safeFromCodePoint(code: number): string {
  if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return ''
  try {
    return String.fromCodePoint(code)
  } catch {
    return ''
  }
}

type HeadersInput = NonNullable<RequestInit['headers']>

function mergeHeaders(
  defaults: Readonly<Record<string, string>>,
  override: HeadersInput | undefined
): Headers {
  const headers = new Headers()
  for (const [k, v] of Object.entries(defaults)) headers.set(k, v)
  if (!override) return headers
  const incoming = new Headers(override as ConstructorParameters<typeof Headers>[0])
  incoming.forEach((value, key) => headers.set(key, value))
  return headers
}

function composeSignals(a: AbortSignal, b: AbortSignal): AbortSignal {
  // Prefer the platform helper when available (Node 20+, modern browsers).
  const anyFn = (AbortSignal as unknown as { any?: (signals: AbortSignal[]) => AbortSignal }).any
  if (typeof anyFn === 'function') return anyFn([a, b])

  const controller = new AbortController()
  const onAbort = (s: AbortSignal) => () => controller.abort(s.reason)
  if (a.aborted) controller.abort(a.reason)
  else a.addEventListener('abort', onAbort(a), { once: true })
  if (b.aborted) controller.abort(b.reason)
  else b.addEventListener('abort', onAbort(b), { once: true })
  return controller.signal
}
