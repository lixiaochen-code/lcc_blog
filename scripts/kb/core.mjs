import fs from "node:fs";
import path from "node:path";

export const projectRoot = process.cwd();
export const notesDir = path.join(projectRoot, "notes");
export const dataDir = path.join(projectRoot, "data");
export const generatedDir = path.join(projectRoot, ".vitepress", "generated");

const SECTION_PRESETS = [
  {
    id: "start",
    title: "开始使用",
    description: "入门说明、工作流记录和快速上手内容。",
    match: (note) => note.category === "inbox" || note.folder === "inbox",
  },
  {
    id: "design",
    title: "知识库设计",
    description: "知识库架构、权限和系统设计相关笔记。",
    match: (note) => note.category === "architecture" || note.folder === "architecture",
  },
  {
    id: "retrieval",
    title: "检索与回答",
    description: "检索策略、上下文压缩和回答约束。",
    match: (note) => note.category === "retrieval" || note.folder === "retrieval",
  },
  {
    id: "frontend",
    title: "前端工程化",
    description: "前端技术、构建工具和工程实践。",
    match: (note) => note.category === "frontend" || note.folder === "frontend",
  },
  {
    id: "tools",
    title: "开发工具",
    description: "外部工具、工作台和基础设施整理。",
    match: (note) => note.category === "tools" || note.folder === "tools",
  },
  {
    id: "web-clips",
    title: "网页摘录",
    description: "从外部网页抓取、整理和归档的内容。",
    match: (note) => note.category === "web-clips" || note.folder === "web-clips",
  },
  {
    id: "unassigned",
    title: "待整理",
    description: "暂未归类但已纳入知识库的笔记。",
    match: () => true,
  },
];

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
  } catch {
    return fallback;
  }
}

export function writeJson(filePath, value) {
  writeText(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export function parseArgs(argv) {
  const args = { _: [] };

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith("--")) {
      args._.push(item);
      continue;
    }

    const [keyPart, inlineValue] = item.slice(2).split("=", 2);
    const key = keyPart.trim();
    if (!key) {
      continue;
    }

    if (inlineValue !== undefined) {
      args[key] = inlineValue;
      continue;
    }

    const next = argv[index + 1];
    if (next && !next.startsWith("--")) {
      args[key] = next;
      index += 1;
    } else {
      args[key] = true;
    }
  }

  return args;
}

function walkMarkdownFiles(startDir, accumulator = []) {
  const entries = fs.readdirSync(startDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue;
    }

    const absolutePath = path.join(startDir, entry.name);
    if (entry.isDirectory()) {
      walkMarkdownFiles(absolutePath, accumulator);
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith(".md")) {
      continue;
    }

    if (absolutePath === path.join(notesDir, "index.md")) {
      continue;
    }

    accumulator.push(absolutePath);
  }

  return accumulator;
}

function parseScalar(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed === "true") {
    return true;
  }
  if (trimmed === "false") {
    return false;
  }
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseArray(value) {
  return value
    .slice(1, -1)
    .split(",")
    .map((item) => parseScalar(item))
    .filter(Boolean);
}

export function parseFrontmatter(raw) {
  if (!raw.startsWith("---\n")) {
    return { data: {}, body: raw };
  }

  const endIndex = raw.indexOf("\n---\n", 4);
  if (endIndex === -1) {
    return { data: {}, body: raw };
  }

  const block = raw.slice(4, endIndex);
  const body = raw.slice(endIndex + 5);
  const data = {};

  for (const line of block.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf(":");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    if (!key) {
      continue;
    }

    if (rawValue.startsWith("[") && rawValue.endsWith("]")) {
      data[key] = parseArray(rawValue);
      continue;
    }

    data[key] = parseScalar(rawValue);
  }

  return { data, body };
}

function formatFrontmatterValue(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => JSON.stringify(String(item))).join(", ")}]`;
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (value === undefined || value === null || value === "") {
    return '""';
  }
  return JSON.stringify(String(value));
}

export function stringifyFrontmatter(data = {}) {
  const lines = ["---"];
  for (const [key, value] of Object.entries(data)) {
    lines.push(`${key}: ${formatFrontmatterValue(value)}`);
  }
  lines.push("---", "");
  return lines.join("\n");
}

export function slugify(input) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/['"`]/g, "")
    .replace(/[\s/]+/g, "-")
    .replace(/[^a-z0-9\u4e00-\u9fa5-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function formatDate(input) {
  if (!input) {
    return "";
  }

  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return String(input);
  }

  return date.toISOString().slice(0, 10);
}

export function normalizeText(value) {
  return String(value || "")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function stripMarkdown(markdown) {
  return normalizeText(
    String(markdown || "")
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
      .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
      .replace(/^>+/gm, "")
      .replace(/^#+\s+/gm, "")
      .replace(/[*_~>-]/g, " ")
      .replace(/\|/g, " ")
      .replace(/\s+/g, " ")
  );
}

function tokenize(input) {
  const rawTokens = String(input || "").toLowerCase().match(/[\p{sc=Han}]{1,}|[a-z0-9]+/gu) || [];
  const expanded = [];

  for (const token of rawTokens) {
    expanded.push(token);
    if (/^[\p{sc=Han}]+$/u.test(token) && token.length > 2) {
      for (let index = 0; index < token.length - 1; index += 1) {
        expanded.push(token.slice(index, index + 2));
      }
    }
  }

  return Array.from(new Set(expanded.filter((token) => token.length)));
}

function inferSection(note) {
  return SECTION_PRESETS.find((section) => section.match(note)) || SECTION_PRESETS.at(-1);
}

function extractHeadings(markdown) {
  return String(markdown || "")
    .split(/\r?\n/)
    .map((line) => line.match(/^\s{0,3}#{1,3}\s+(.+?)\s*$/))
    .filter(Boolean)
    .map((match) => match[1].trim())
    .slice(0, 12);
}

function createExcerpt(text, length = 140) {
  const normalized = normalizeText(text).replace(/\s+/g, " ");
  if (normalized.length <= length) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(0, length - 1)).trim()}…`;
}

function createNoteRecord(absolutePath) {
  const relativePath = path.relative(projectRoot, absolutePath).replace(/\\/g, "/");
  const fileName = path.basename(absolutePath, ".md");
  const folder = path.basename(path.dirname(absolutePath));
  const raw = readText(absolutePath);
  const { data, body } = parseFrontmatter(raw);
  const plainText = stripMarkdown(body);
  const headings = extractHeadings(body);
  const title = String(data.title || headings[0] || fileName).trim();
  const tags = Array.isArray(data.tags)
    ? data.tags.map((item) => String(item).trim()).filter(Boolean)
    : String(data.tags || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
  const category = String(data.category || folder || "unassigned").trim();
  const relativeSlug = relativePath.replace(/^notes\//, "").replace(/\.md$/, "");
  const id = slugify(relativeSlug) || slugify(title) || fileName;
  const section = inferSection({ folder, category, relativePath });
  const createdAt = String(data.createdAt || fs.statSync(absolutePath).birthtime.toISOString());
  const updatedAt = String(data.updatedAt || fs.statSync(absolutePath).mtime.toISOString());
  const summary = String(data.summary || createExcerpt(plainText, 120)).trim();

  return {
    id,
    slug: fileName,
    title,
    summary,
    tags,
    aliases: Array.isArray(data.aliases) ? data.aliases.map((item) => String(item).trim()).filter(Boolean) : [],
    category,
    folder,
    sectionId: section.id,
    sectionTitle: section.title,
    createdAt,
    updatedAt,
    relativePath,
    url: `/${relativePath.replace(/\.md$/, "").replace(/\\/g, "/")}`,
    headings,
    excerpt: createExcerpt(plainText, 180),
    plainText,
    readingTime: Math.max(1, Math.round(plainText.length / 320)),
  };
}

function scoreDocument(note, query) {
  const normalizedQuery = String(query || "").trim().toLowerCase();
  if (!normalizedQuery) {
    return 0;
  }

  const haystack = `${note.title} ${note.summary} ${note.tags.join(" ")} ${note.aliases.join(" ")} ${note.sectionTitle} ${note.plainText}`.toLowerCase();
  const title = note.title.toLowerCase();
  const summary = note.summary.toLowerCase();
  const tags = note.tags.join(" ").toLowerCase();
  const aliases = note.aliases.join(" ").toLowerCase();
  const tokens = tokenize(normalizedQuery);

  let score = 0;

  if (title.includes(normalizedQuery)) {
    score += 120;
  }
  if (summary.includes(normalizedQuery)) {
    score += 60;
  }
  if (tags.includes(normalizedQuery)) {
    score += 50;
  }
  if (aliases.includes(normalizedQuery)) {
    score += 40;
  }
  if (haystack.includes(normalizedQuery)) {
    score += 30;
  }

  let matchedTokens = 0;
  for (const token of tokens) {
    if (title.includes(token)) {
      score += 28;
      matchedTokens += 1;
    } else if (tags.includes(token)) {
      score += 18;
      matchedTokens += 1;
    } else if (summary.includes(token)) {
      score += 12;
      matchedTokens += 1;
    } else if (haystack.includes(token)) {
      score += 6;
      matchedTokens += 1;
    }
  }

  if (tokens.length > 1 && matchedTokens === tokens.length) {
    score += 20;
  }

  return score;
}

function computeRelatedNotes(notes) {
  const relatedMap = new Map();

  for (const note of notes) {
    const related = notes
      .filter((candidate) => candidate.id !== note.id)
      .map((candidate) => {
        const sharedTags = candidate.tags.filter((tag) => note.tags.includes(tag)).length;
        const sharedWords = tokenize(`${candidate.title} ${candidate.summary}`).filter((token) =>
          tokenize(`${note.title} ${note.summary}`).includes(token)
        ).length;
        return {
          note: candidate,
          score: sharedTags * 8 + sharedWords * 3 + Number(candidate.sectionId === note.sectionId) * 2,
        };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || String(b.note.updatedAt).localeCompare(String(a.note.updatedAt)))
      .slice(0, 3)
      .map((item) => ({
        id: item.note.id,
        title: item.note.title,
        url: item.note.url,
      }));

    relatedMap.set(note.id, related);
  }

  return relatedMap;
}

export function loadKnowledgeBase() {
  const filePath = path.join(dataDir, "knowledge-base.json");
  return readJson(filePath, null);
}

export function searchKnowledgeBase(base, query, limit = 5) {
  const notes = Array.isArray(base?.notes) ? base.notes : [];
  const normalizedQuery = String(query || "").trim();
  if (!normalizedQuery) {
    return notes
      .slice()
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
      .slice(0, limit)
      .map((note) => ({ ...note, score: 0 }));
  }

  return notes
    .map((note) => ({ ...note, score: scoreDocument(note, normalizedQuery) }))
    .filter((note) => note.score > 0)
    .sort((a, b) => b.score - a.score || String(b.updatedAt).localeCompare(String(a.updatedAt)))
    .slice(0, limit);
}

export function buildAnswerContext(query, matches) {
  const lines = [`问题：${query}`, "", "命中文档：", ""];

  for (const match of matches) {
    lines.push(`- ${match.title} (${match.url})`);
    lines.push(`  摘要：${match.summary}`);
    lines.push(`  标签：${match.tags.join("、") || "无"}`);
    lines.push(`  摘录：${createExcerpt(match.plainText, 240)}`);
    lines.push("");
  }

  return lines.join("\n").trim();
}

function buildNotesIndex(base) {
  const lines = [
    "---",
    'title: "知识库目录"',
    'description: "重新构建后的个人知识库总览页"',
    "---",
    "",
    "# 知识库目录",
    "",
    `当前收录 **${base.stats.totalNotes}** 篇笔记，覆盖 **${base.stats.totalSections}** 个知识分区。`,
    "",
    "<NoteExplorer />",
    "",
    "## 最近更新",
    "",
  ];

  for (const note of base.notes
    .slice()
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
    .slice(0, 8)) {
    lines.push(`- [${note.title}](${note.url}) · ${formatDate(note.updatedAt)} · ${note.summary}`);
  }

  for (const section of base.sections) {
    const items = base.notes.filter((note) => note.sectionId === section.id);
    if (!items.length) {
      continue;
    }

    lines.push("", `## ${section.title}`, "", section.description, "");
    for (const note of items) {
      const tagText = note.tags.length ? ` · 标签：${note.tags.join("、")}` : "";
      lines.push(`- [${note.title}](${note.url})${tagText}`);
    }
  }

  writeText(path.join(notesDir, "index.md"), `${lines.join("\n")}\n`);
}

function buildVitepressData(base) {
  const nav = [
    { text: "首页", link: "/" },
    { text: "知识库", link: "/notes/" },
    { text: "AI 工作台", link: "/ai/" },
  ];

  const sidebarGroups = base.sections
    .map((section) => {
      const items = base.notes.filter((note) => note.sectionId === section.id);
      if (!items.length) {
        return null;
      }

      return {
        text: section.title,
        items: items.map((note) => ({
          text: note.title,
          link: note.url,
        })),
      };
    })
    .filter(Boolean);

  const sidebar = {
    "/notes/": [
      {
        text: "总览",
        items: [{ text: "知识库目录", link: "/notes/" }],
      },
      ...sidebarGroups,
    ],
    "/ai/": [
      {
        text: "AI 工作台",
        items: [{ text: "问答与检索", link: "/ai/" }],
      },
    ],
  };

  const clientData = {
    hero: {
      title: "LCC Knowledge Lab",
      tagline: "把个人笔记、检索和 AI 对话收束到同一套 Markdown-first 工作流里。",
    },
    stats: base.stats,
    sections: base.sections,
    featured: base.notes
      .slice()
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
      .slice(0, 6)
      .map((note) => ({
        id: note.id,
        title: note.title,
        summary: note.summary,
        url: note.url,
        sectionTitle: note.sectionTitle,
        updatedAt: note.updatedAt,
      })),
    tags: base.tags.slice(0, 24),
  };

  writeText(
    path.join(generatedDir, "kb.mjs"),
    `export const kbNav = ${JSON.stringify(nav, null, 2)};\n\nexport const kbSidebar = ${JSON.stringify(
      sidebar,
      null,
      2
    )};\n\nexport const kbData = ${JSON.stringify(clientData, null, 2)};\n`
  );
}

export function createKnowledgeBase() {
  const noteFiles = walkMarkdownFiles(notesDir).sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
  const notes = noteFiles.map((absolutePath) => createNoteRecord(absolutePath));
  const relatedMap = computeRelatedNotes(notes);
  const sections = SECTION_PRESETS.map((section) => ({
    id: section.id,
    title: section.title,
    description: section.description,
    count: notes.filter((note) => note.sectionId === section.id).length,
  })).filter((section) => section.count > 0);
  const tags = Array.from(new Set(notes.flatMap((note) => note.tags)))
    .sort((a, b) => a.localeCompare(b, "zh-Hans-CN"))
    .map((name) => ({
      name,
      count: notes.filter((note) => note.tags.includes(name)).length,
    }));

  const base = {
    generatedAt: new Date().toISOString(),
    site: {
      title: "小晨的学习知识库",
      description: "一个重新设计的 Markdown-first 个人知识系统。",
    },
    stats: {
      totalNotes: notes.length,
      totalSections: sections.length,
      totalTags: tags.length,
      totalReadingMinutes: notes.reduce((sum, note) => sum + note.readingTime, 0),
    },
    sections,
    tags,
    notes: notes.map((note) => ({
      ...note,
      related: relatedMap.get(note.id) || [],
    })),
  };

  return base;
}

export function buildKnowledgeArtifacts() {
  ensureDir(dataDir);
  ensureDir(generatedDir);

  const base = createKnowledgeBase();
  writeJson(path.join(dataDir, "knowledge-base.json"), base);
  buildNotesIndex(base);
  buildVitepressData(base);
  return base;
}
