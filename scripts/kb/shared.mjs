import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

export const projectRoot = process.cwd();
export const notesDir = path.join(projectRoot, "notes");
export const dataDir = path.join(projectRoot, "data");
export const generatedDir = path.join(projectRoot, ".vitepress", "generated");

const EXCLUDED_DIRS = new Set(["node_modules", ".git", ".vitepress", "scripts", "data", "skills"]);
const EXCLUDED_ROOT_FILES = new Set(["index.md"]);

export function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

export function writeText(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
}

export function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(readText(filePath));
  } catch (error) {
    return fallback;
  }
}

export function writeJson(filePath, value) {
  writeText(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export function runKbBuild() {
  const result = spawnSync(process.execPath, [path.join(projectRoot, "scripts", "kb", "build.mjs")], {
    cwd: projectRoot,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    const stdout = String(result.stdout || "").trim();
    const stderr = String(result.stderr || "").trim();
    if (stdout) {
      console.error(stdout);
    }
    if (stderr) {
      console.error(stderr);
    }
    process.exit(result.status ?? 1);
  }
}

export function shouldBuildFromArgs(args, defaultValue = true) {
  const rawValue = args?.build;

  if (rawValue === undefined) {
    return defaultValue;
  }

  if (typeof rawValue === "boolean") {
    return rawValue;
  }

  const normalized = String(rawValue).trim().toLowerCase();
  if (["false", "0", "no", "off"].includes(normalized)) {
    return false;
  }

  if (["true", "1", "yes", "on"].includes(normalized)) {
    return true;
  }

  return defaultValue;
}

export function slugify(input) {
  const value = String(input || "")
    .trim()
    .toLowerCase()
    .replace(/['"`]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9\u4e00-\u9fa5-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return value || `note-${Date.now()}`;
}

export function parseArgs(argv) {
  const args = { _: [] };

  for (let i = 0; i < argv.length; i += 1) {
    const part = argv[i];

    if (!part.startsWith("--")) {
      args._.push(part);
      continue;
    }

    const [rawKey, rawValue] = part.slice(2).split("=", 2);
    const key = rawKey.trim();

    if (!key) {
      continue;
    }

    if (rawValue !== undefined) {
      args[key] = rawValue;
      continue;
    }

    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      args[key] = next;
      i += 1;
    } else {
      args[key] = true;
    }
  }

  return args;
}

export function splitList(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseFrontmatterValue(value) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (trimmed === "true") {
    return true;
  }

  if (trimmed === "false") {
    return false;
  }

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed
      .slice(1, -1)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => item.replace(/^['"]|['"]$/g, ""));
  }

  return trimmed.replace(/^['"]|['"]$/g, "");
}

export function parseFrontmatter(raw) {
  if (!raw.startsWith("---\n")) {
    return { data: {}, body: raw };
  }

  const endIndex = raw.indexOf("\n---\n", 4);
  if (endIndex === -1) {
    return { data: {}, body: raw };
  }

  const frontmatterBlock = raw.slice(4, endIndex);
  const body = raw.slice(endIndex + 5);
  const data = {};

  for (const line of frontmatterBlock.split("\n")) {
    if (!line.trim()) {
      continue;
    }

    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) {
      continue;
    }

    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1);
    data[key] = parseFrontmatterValue(value);
  }

  return { data, body };
}

function serializeFrontmatterValue(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => JSON.stringify(String(item))).join(", ")}]`;
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (value === undefined || value === null) {
    return '""';
  }

  return JSON.stringify(String(value));
}

export function toFrontmatter(data) {
  const lines = Object.entries(data)
    .filter(([, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== undefined && value !== null && value !== "";
    })
    .map(([key, value]) => `${key}: ${serializeFrontmatterValue(value)}`);

  if (lines.length === 0) {
    return "";
  }

  return `---\n${lines.join("\n")}\n---\n\n`;
}

export function stripMarkdown(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\|.*\|$/gm, " ")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\r/g, "")
    .replace(/\n+/g, "\n")
    .trim();
}

export function extractTitle(body, fallback) {
  const match = body.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : fallback;
}

export function extractHeadings(body) {
  return body
    .split("\n")
    .map((line) => line.match(/^#{2,3}\s+(.+)$/))
    .filter(Boolean)
    .map((match) => match[1].trim());
}

export function extractSummary(body) {
  const plainText = stripMarkdown(body);
  const paragraphs = plainText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length >= 12);

  if (paragraphs.length === 0) {
    return "";
  }

  return paragraphs[0].slice(0, 140);
}

function relativeUrlFromPath(filePath) {
  const relative = path.relative(projectRoot, filePath).replace(/\\/g, "/");
  return `/${relative.replace(/\.md$/i, "")}`;
}

export function getManagedMarkdownFiles() {
  const files = [];

  function walk(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      const relative = path.relative(projectRoot, fullPath).replace(/\\/g, "/");

      if (entry.isDirectory()) {
        if (EXCLUDED_DIRS.has(entry.name)) {
          continue;
        }
        walk(fullPath);
        continue;
      }

      if (!entry.name.endsWith(".md")) {
        continue;
      }

      if (!relative.includes("/") && EXCLUDED_ROOT_FILES.has(entry.name)) {
        continue;
      }

      if (relative === "notes/index.md") {
        continue;
      }

      files.push(fullPath);
    }
  }

  walk(projectRoot);

  return files.sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
}

export function readNote(filePath) {
  const raw = readText(filePath);
  const { data, body } = parseFrontmatter(raw);
  const stat = fs.statSync(filePath);
  const relativePath = path.relative(projectRoot, filePath).replace(/\\/g, "/");
  const fallbackTitle = path.basename(filePath, ".md");
  const title = data.title || extractTitle(body, fallbackTitle);
  const summary = data.summary || extractSummary(body);
  const tags = splitList(data.tags);
  const aliases = splitList(data.aliases);
  const headings = extractHeadings(body);
  const plainText = stripMarkdown(body);
  const url = data.url || relativeUrlFromPath(filePath);
  const id = data.id || relativePath.replace(/\.md$/i, "");
  const updatedAt = data.updatedAt || stat.mtime.toISOString();
  const createdAt = data.createdAt || stat.birthtime.toISOString();
  const category =
    data.category ||
    (relativePath.startsWith("notes/") ? relativePath.split("/")[1] || "notes" : "legacy");

  return {
    id,
    title,
    summary,
    tags,
    aliases,
    headings,
    url,
    relativePath,
    absolutePath: filePath,
    category,
    createdAt,
    updatedAt,
    content: plainText,
    body,
  };
}

export function getAllNotes() {
  return getManagedMarkdownFiles().map(readNote);
}

function countOccurrences(haystack, needle) {
  if (!haystack || !needle) {
    return 0;
  }

  let count = 0;
  let startIndex = 0;

  while (startIndex < haystack.length) {
    const foundIndex = haystack.indexOf(needle, startIndex);
    if (foundIndex === -1) {
      break;
    }
    count += 1;
    startIndex = foundIndex + needle.length;
  }

  return count;
}

export function tokenizeQuery(query) {
  const trimmed = String(query || "").trim().toLowerCase();
  if (!trimmed) {
    return [];
  }

  const parts = trimmed
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length > 1) {
    return Array.from(new Set([trimmed, ...parts]));
  }

  return [trimmed];
}

export function isOverviewQuery(query) {
  const normalized = String(query || "").trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  const patterns = [
    /(当前|现在|目前)?知识库.*(哪些|什么|啥|内容|笔记|文章|资料|文档|目录|分类)/,
    /(查看|列出|展示|浏览|看看).*(知识库|笔记|文章|目录|内容)/,
    /(知识库|笔记|文章|目录|内容).*(概览|总览|overview|list|contents)/,
    /(有哪些内容|有什么内容|都有什么|有哪些笔记|有哪些文章)/,
  ];

  return patterns.some((pattern) => pattern.test(normalized));
}

export function buildKnowledgeBaseOverview(notes, options = {}) {
  const latestLimit = Number(options.latestLimit || 8);
  const categories = new Map();

  for (const note of notes) {
    const category = String(note.category || "uncategorized").trim() || "uncategorized";
    const current = categories.get(category) || {
      category,
      count: 0,
      latestUpdatedAt: "",
      sampleTitles: [],
    };
    current.count += 1;
    if (!current.latestUpdatedAt || String(note.updatedAt) > String(current.latestUpdatedAt)) {
      current.latestUpdatedAt = note.updatedAt;
    }
    if (current.sampleTitles.length < 3) {
      current.sampleTitles.push(note.title);
    }
    categories.set(category, current);
  }

  const latestNotes = [...notes]
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
    .slice(0, latestLimit)
    .map((note) => ({
      title: note.title,
      path: note.relativePath,
      url: note.url,
      summary: note.summary,
      tags: note.tags,
      updatedAt: note.updatedAt,
      category: note.category,
    }));

  return {
    totalNotes: notes.length,
    totalCategories: categories.size,
    categories: [...categories.values()].sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return a.category.localeCompare(b.category, "zh-Hans-CN");
    }),
    latestNotes,
  };
}

export function buildSnippet(note, query) {
  const text = note.content;
  const loweredText = text.toLowerCase();
  const terms = tokenizeQuery(query);

  let bestIndex = -1;
  for (const term of terms) {
    const termIndex = loweredText.indexOf(term);
    if (termIndex !== -1) {
      bestIndex = termIndex;
      break;
    }
  }

  if (bestIndex === -1) {
    return note.summary;
  }

  const start = Math.max(0, bestIndex - 48);
  const end = Math.min(text.length, bestIndex + 96);
  const snippet = text.slice(start, end).replace(/\s+/g, " ").trim();
  return `${start > 0 ? "..." : ""}${snippet}${end < text.length ? "..." : ""}`;
}

export function searchNotes(notes, query, limit = 5) {
  const terms = tokenizeQuery(query);

  const results = notes
    .map((note) => {
      const title = note.title.toLowerCase();
      const summary = note.summary.toLowerCase();
      const headings = note.headings.join(" ").toLowerCase();
      const content = note.content.toLowerCase();
      const tags = note.tags.join(" ").toLowerCase();
      const aliases = note.aliases.join(" ").toLowerCase();
      const combinedTitle = `${title} ${aliases}`;

      let score = 0;

      for (const term of terms) {
        score += countOccurrences(combinedTitle, term) * 30;
        score += countOccurrences(tags, term) * 18;
        score += countOccurrences(headings, term) * 12;
        score += countOccurrences(summary, term) * 8;
        score += countOccurrences(content, term) * 4;
      }

      if (query && combinedTitle.includes(String(query).toLowerCase())) {
        score += 40;
      }

      if (query && note.content.includes(query)) {
        score += 10;
      }

      return {
        ...note,
        score,
        snippet: buildSnippet(note, query),
      };
    })
    .filter((note) => note.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return String(b.updatedAt).localeCompare(String(a.updatedAt));
    });

  return results.slice(0, limit);
}

export function formatDate(isoString) {
  return String(isoString).slice(0, 10);
}

export function makeNoteDocument(frontmatter, body) {
  return `${toFrontmatter(frontmatter)}${body.trimEnd()}\n`;
}
