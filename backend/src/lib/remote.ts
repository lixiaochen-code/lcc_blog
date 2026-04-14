type RemoteResource = {
  url: string;
  title: string;
  summary: string;
  excerpt: string;
  source: string;
};

const defaultHeaders = {
  "User-Agent": "lcc-knowledge-lab/1.0",
  Accept: "text/html,application/json;q=0.9,*/*;q=0.8",
};

function stripHtml(html: string) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text: string, size = 280) {
  const normalized = String(text || "").trim();
  if (normalized.length <= size) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(0, size - 1)).trim()}…`;
}

function matchMeta(html: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }
  return "";
}

export function extractUrls(message: string) {
  return Array.from(new Set(String(message || "").match(/https?:\/\/[^\s]+/g) || [])).map((url) =>
    url.replace(/[),.;!?]+$/, "")
  );
}

export function extractUrlsFromHistory(history: Array<{ role?: string; content?: string }>, limit = 2) {
  const ordered = [...history].reverse();
  const collected: string[] = [];

  for (const item of ordered) {
    const urls = extractUrls(String(item?.content || ""));
    for (const url of urls) {
      if (!collected.includes(url)) {
        collected.push(url);
      }
      if (collected.length >= limit) {
        return collected;
      }
    }
  }

  return collected;
}

function parseGitHubRepoUrl(input: string) {
  try {
    const url = new URL(input);
    if (url.hostname !== "github.com") {
      return null;
    }

    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length < 2) {
      return null;
    }

    return {
      owner: parts[0],
      repo: parts[1],
      canonicalUrl: `https://github.com/${parts[0]}/${parts[1]}`,
    };
  } catch {
    return null;
  }
}

async function inspectGitHubRepo(url: string): Promise<RemoteResource | null> {
  const parsed = parseGitHubRepoUrl(url);
  if (!parsed) {
    return null;
  }

  const repoResponse = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`, {
    headers: {
      ...defaultHeaders,
      Accept: "application/vnd.github+json",
    },
  });
  if (!repoResponse.ok) {
    throw new Error(`GitHub repo request failed: ${repoResponse.status}`);
  }

  const repoPayload = (await repoResponse.json()) as {
    full_name?: string;
    description?: string;
    homepage?: string;
    language?: string;
    stargazers_count?: number;
    topics?: string[];
    default_branch?: string;
  };

  let readmeText = "";
  const readmeResponse = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/readme`, {
    headers: {
      ...defaultHeaders,
      Accept: "application/vnd.github.raw+json",
    },
  });
  if (readmeResponse.ok) {
    readmeText = await readmeResponse.text();
  }

  const summaryParts = [
    repoPayload.description || "",
    repoPayload.language ? `主要语言：${repoPayload.language}` : "",
    Number.isFinite(repoPayload.stargazers_count) ? `Stars：${repoPayload.stargazers_count}` : "",
    Array.isArray(repoPayload.topics) && repoPayload.topics.length ? `主题：${repoPayload.topics.join("、")}` : "",
    repoPayload.homepage ? `主页：${repoPayload.homepage}` : "",
  ].filter(Boolean);

  const excerpt = truncate(
    readmeText
      .replace(/^#+\s+/gm, "")
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
      .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
    700
  );

  return {
    url: parsed.canonicalUrl,
    title: repoPayload.full_name || `${parsed.owner}/${parsed.repo}`,
    summary: summaryParts.join("；") || "未获取到仓库描述。",
    excerpt,
    source: "github",
  };
}

async function inspectGenericWebPage(url: string): Promise<RemoteResource> {
  const response = await fetch(url, { headers: defaultHeaders });
  if (!response.ok) {
    throw new Error(`Page request failed: ${response.status}`);
  }

  const html = await response.text();
  const title =
    matchMeta(html, [/<title[^>]*>([\s\S]*?)<\/title>/i, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i]) ||
    url;
  const summary =
    matchMeta(html, [
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i,
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)/i,
    ]) || "未获取到页面摘要。";

  const text = stripHtml(html);
  return {
    url,
    title,
    summary: truncate(summary, 240),
    excerpt: truncate(text, 700),
    source: "web",
  };
}

export async function inspectRemoteResource(url: string): Promise<RemoteResource> {
  const github = parseGitHubRepoUrl(url);
  if (github) {
    return (await inspectGitHubRepo(url)) as RemoteResource;
  }

  return inspectGenericWebPage(url);
}

export function createRemoteContext(resources: RemoteResource[]) {
  if (!resources.length) {
    return "";
  }

  const lines = ["外部资料：", ""];
  for (const item of resources) {
    lines.push(`- 标题：${item.title}`);
    lines.push(`  链接：${item.url}`);
    lines.push(`  来源：${item.source}`);
    lines.push(`  摘要：${item.summary}`);
    lines.push(`  摘录：${item.excerpt}`);
    lines.push("");
  }

  return lines.join("\n").trim();
}

export function createRemoteFallbackAnswer(query: string, resources: RemoteResource[]) {
  if (!resources.length) {
    return null;
  }

  const top = resources[0];
  const answer = [
    `我先查看了你提供的外部链接。`,
    "",
    `针对“${query}”，当前最相关的远程内容是《${top.title}》。`,
    top.summary ? `摘要：${top.summary}` : "",
    top.excerpt ? `补充信息：${truncate(top.excerpt, 320)}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    answer,
    references: resources.map((item) => ({
      id: item.url,
      title: item.title,
      url: item.url,
    })),
  };
}
