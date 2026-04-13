import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import {
  makeNoteDocument,
  notesDir,
  slugify,
  splitList,
  writeText,
  runKbBuild,
  parseArgs,
  shouldBuildFromArgs,
  readProjectEnv,
} from "./shared.mjs";

const DEFAULT_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";

const KNOWN_CHROME_PATHS = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
].filter(Boolean);

function normalizeProxyUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }
  if (/^https?:\/\//i.test(raw) || /^socks5?:\/\//i.test(raw)) {
    return raw;
  }
  return `http://${raw}`;
}

function getProxyUrl() {
  const env = readProjectEnv();
  return normalizeProxyUrl(env.proxy_url || env.PROXY_URL || env.AI_URL_PROXY);
}

function getProxyEnv() {
  const env = readProjectEnv();
  const proxyUrl = getProxyUrl();
  if (!proxyUrl) {
    return env;
  }
  return {
    ...env,
    proxy_url: proxyUrl,
    PROXY_URL: proxyUrl,
    AI_URL_PROXY: proxyUrl,
    HTTP_PROXY: proxyUrl,
    HTTPS_PROXY: proxyUrl,
    ALL_PROXY: proxyUrl,
    http_proxy: proxyUrl,
    https_proxy: proxyUrl,
    all_proxy: proxyUrl,
  };
}

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    input: options.input,
    maxBuffer: 20 * 1024 * 1024,
    env: getProxyEnv(),
  });

  return {
    ok: result.status === 0,
    status: result.status,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
  };
}

function escapeUrl(url) {
  return String(url || "").trim();
}

function fetchWithCurl(url) {
  return runCommand("curl", [
    "-sS",
    "-L",
    "--compressed",
    "--max-time",
    "30",
    "-A",
    DEFAULT_UA,
    "-H",
    "Accept-Language: zh-CN,zh;q=0.9,en;q=0.8",
    url,
  ]);
}

function findChromeExecutable() {
  for (const executable of KNOWN_CHROME_PATHS) {
    const probe = runCommand("test", ["-x", executable]);
    if (probe.ok) {
      return executable;
    }
  }
  return null;
}

function fetchWithChrome(url) {
  const chromePath = findChromeExecutable();
  const proxyUrl = getProxyUrl();
  if (!chromePath) {
    return {
      ok: false,
      status: 1,
      stdout: "",
      stderr: "Chrome executable not found for browser rendering fallback.",
    };
  }

  const userDataDir = path.join(os.tmpdir(), `kb-chrome-${Date.now()}`);
  return runCommand(chromePath, [
    "--headless",
    "--disable-gpu",
    "--disable-software-rasterizer",
    "--disable-dev-shm-usage",
    "--hide-scrollbars",
    "--virtual-time-budget=12000",
    ...(proxyUrl ? [`--proxy-server=${proxyUrl}`] : []),
    `--user-data-dir=${userDataDir}`,
    `--user-agent=${DEFAULT_UA}`,
    "--dump-dom",
    url,
  ]);
}

function extractArticle(html, url) {
  const result = runCommand("python3", [path.join(process.cwd(), "scripts", "kb", "extract_article.py"), "--url", url], {
    input: html,
  });

  if (!result.ok) {
    return {
      ok: false,
      error: result.stderr || "Failed to extract article content.",
    };
  }

  try {
    return {
      ok: true,
      data: JSON.parse(result.stdout),
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Invalid extractor output.",
    };
  }
}

function detectBlockReason(html, article) {
  const haystack = `${html}\n${article?.plainText || ""}`;
  const rules = [
    {
      pattern: /(环境异常|完成验证后即可继续访问|去验证)/i,
      reason: "The site is showing an environment verification page.",
    },
    {
      pattern: /(captcha|verify you are human|robot check|are you human)/i,
      reason: "The site is asking for captcha or human verification.",
    },
    {
      pattern: /(access denied|forbidden|not authorized)/i,
      reason: "The site is denying access in the current environment.",
    },
  ];

  for (const rule of rules) {
    if (rule.pattern.test(haystack)) {
      return rule.reason;
    }
  }

  return "";
}

function needsBrowserFallback(html, article) {
  if (!article?.ok) {
    return true;
  }

  const plainText = article.data.plainText || "";
  if (detectBlockReason(html, article.data)) {
    return true;
  }

  if (plainText.length < 600) {
    return true;
  }

  const scriptCount = (html.match(/<script\b/gi) || []).length;
  const bodyCount = (html.match(/<(p|article|main|section)\b/gi) || []).length;
  if (scriptCount > 20 && bodyCount < 8) {
    return true;
  }

  return false;
}

function summarizeText(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);
}

export function inspectUrl(url, options = {}) {
  const targetUrl = escapeUrl(url);
  if (!targetUrl) {
    return { ok: false, error: "Missing URL." };
  }

  const strategies = [];
  const curlResult = fetchWithCurl(targetUrl);
  if (curlResult.ok && curlResult.stdout) {
    const extracted = extractArticle(curlResult.stdout, targetUrl);
    strategies.push({
      transport: "http",
      extractionOk: extracted.ok,
      textLength: extracted.ok ? extracted.data.textLength : 0,
    });

    if (!needsBrowserFallback(curlResult.stdout, extracted)) {
      return {
        ok: extracted.ok,
        strategy: "http",
        html: curlResult.stdout,
        article: extracted.ok ? extracted.data : null,
        error: extracted.ok ? "" : extracted.error,
        strategies,
      };
    }
  }

  const browserResult = fetchWithChrome(targetUrl);
  if (browserResult.ok && browserResult.stdout) {
    const extracted = extractArticle(browserResult.stdout, targetUrl);
    const blockReason = extracted.ok ? detectBlockReason(browserResult.stdout, extracted.data) : "";

    strategies.push({
      transport: "browser",
      extractionOk: extracted.ok,
      textLength: extracted.ok ? extracted.data.textLength : 0,
      blocked: Boolean(blockReason),
    });

    return {
      ok: extracted.ok && !blockReason,
      strategy: "browser",
      html: browserResult.stdout,
      article: extracted.ok ? extracted.data : null,
      error: blockReason || (extracted.ok ? "" : extracted.error),
      strategies,
      blockedReason: blockReason,
    };
  }

  return {
    ok: false,
    strategy: "none",
    article: null,
    error:
      browserResult.stderr?.trim() ||
      curlResult.stderr?.trim() ||
      "Failed to fetch URL.",
    strategies,
  };
}

export function ingestUrl(url, options = {}) {
  const inspected = inspectUrl(url, options);
  if (!inspected.ok || !inspected.article) {
    return inspected;
  }

  const article = inspected.article;
  const title = article.title || options.title || `网页摘录 ${new Date().toISOString().slice(0, 10)}`;
  const category = slugify(options.category || "web-clips");
  const summary = options.summary || article.description || summarizeText(article.plainText);
  const tags = splitList(options.tags || `${article.siteName || "web"},网页摘录`);
  const aliases = splitList(options.aliases);
  const slug = slugify(options.slug || title);
  const now = new Date().toISOString();
  const filePath = path.join(notesDir, category, `${slug}.md`);
  const buildTriggered = shouldBuildFromArgs(options, false);

  const body = [
    `# ${title}`,
    "",
    `> 来源：[${article.siteName || article.url}](${article.url})`,
    article.author ? `> 作者：${article.author}` : "",
    article.publishedAt ? `> 发布时间：${article.publishedAt}` : "",
    `> 抓取方式：${inspected.strategy}`,
    "",
    article.contentMarkdown || article.plainText,
    "",
  ]
    .filter(Boolean)
    .join("\n");

  writeText(
    filePath,
    makeNoteDocument(
      {
        title,
        summary,
        tags,
        aliases,
        category,
        sourceUrl: article.url,
        sourceSite: article.siteName,
        createdAt: now,
        updatedAt: now,
      },
      body
    )
  );
  if (buildTriggered) {
    runKbBuild();
  }

  return {
    ok: true,
    action: "ingest-url",
    title,
    path: path.relative(process.cwd(), filePath).replace(/\\/g, "/"),
    strategy: inspected.strategy,
    summary,
    buildTriggered,
  };
}

function sanitizeInspectResult(result, options = {}) {
  if (options.includeHtml) {
    return result;
  }

  const { html, ...rest } = result;
  return rest;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv.slice(2));
  const action = String(args.action || "inspect").trim();
  const url = String(args.url || "").trim();

  let result;
  if (action === "inspect") {
    result = inspectUrl(url, args);
  } else if (action === "ingest") {
    result = ingestUrl(url, args);
  } else {
    result = { ok: false, error: `Unsupported action: ${action}` };
  }

  console.log(`${JSON.stringify(sanitizeInspectResult(result, args), null, 2)}\n`);
  process.exit(result.ok ? 0 : 1);
}
