import path from "node:path";
import {
  dataDir,
  ensureDir,
  formatDate,
  generatedDir,
  getAllNotes,
  readJson,
  writeJson,
  writeText,
} from "./shared.mjs";

const docsConfigPath = path.join(dataDir, "docs.json");

const notes = getAllNotes().map((note) => ({
  id: note.id,
  title: note.title,
  summary: note.summary,
  tags: note.tags,
  aliases: note.aliases,
  headings: note.headings,
  url: note.url,
  relativePath: note.relativePath,
  category: note.category,
  createdAt: note.createdAt,
  updatedAt: note.updatedAt,
  contentPreview: note.content.slice(0, 280),
  related: [],
}));

for (const note of notes) {
  const noteTagSet = new Set(note.tags);
  note.related = notes
    .filter((candidate) => candidate.id !== note.id)
    .map((candidate) => ({
      candidate,
      overlap: candidate.tags.filter((tag) => noteTagSet.has(tag)).length,
    }))
    .filter((item) => item.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, 3)
    .map((item) => ({
      id: item.candidate.id,
      title: item.candidate.title,
      url: item.candidate.url,
    }));
}

ensureDir(dataDir);
ensureDir(generatedDir);

const docsConfig = syncDocsConfig(notes, readJson(docsConfigPath, null));
writeJson(docsConfigPath, docsConfig);

writeJson(path.join(dataDir, "knowledge-base.json"), {
  generatedAt: new Date().toISOString(),
  totalNotes: notes.length,
  notes,
});

const notesByPath = new Map(notes.map((note) => [note.relativePath, note]));
const sectionsById = new Map(docsConfig.sections.map((section) => [section.id, section]));
const visibleEntries = docsConfig.entries
  .filter((entry) => notesByPath.has(entry.path) && entry.hidden !== true)
  .map((entry) => ({
    ...entry,
    note: notesByPath.get(entry.path),
    section: sectionsById.get(entry.section),
  }));

const managedEntries = visibleEntries.filter((entry) => entry.note.relativePath.startsWith("notes/"));
const managedSections = docsConfig.sections.filter((section) =>
  managedEntries.some((entry) => entry.section?.id === section.id)
);
buildKnowledgeIndex(notes, managedEntries, managedSections);
buildNavigation(managedEntries, managedSections);

console.log(`Knowledge base built with ${notes.length} notes.`);

function defaultDocsConfig() {
  return {
    meta: {
      version: 1,
      mode: "ai-managed",
      description: "AI-driven documentation registry. Directory structure, grouping, titles, and order are driven by this file.",
    },
    sections: [
      {
        id: "start",
        title: "开始使用",
        description: "知识库入口、使用说明和日常工作流。",
        scope: "notes",
        order: 10,
      },
      {
        id: "design",
        title: "知识库设计",
        description: "记录知识库架构、AI 驱动方式和组织原则。",
        scope: "notes",
        order: 20,
      },
      {
        id: "retrieval",
        title: "检索与回答",
        description: "低 token 检索、召回约束和回答策略。",
        scope: "notes",
        order: 30,
      },
      {
        id: "web-clips",
        title: "网页摘录",
        description: "从外部网页或公众号导入的内容。",
        scope: "notes",
        order: 40,
      },
      {
        id: "pages",
        title: "独立页面",
        description: "站点中的历史笔记和非知识库页面。",
        scope: "pages",
        order: 50,
      },
      {
        id: "unassigned",
        title: "待整理",
        description: "尚未归档到稳定结构中的文档。",
        scope: "notes",
        order: 999,
      },
    ],
    entries: [],
  };
}

function inferSectionId(note) {
  if (note.relativePath === "notes/inbox/getting-started.md") {
    return "start";
  }
  if (note.category === "inbox") {
    return "start";
  }
  if (note.category === "architecture") {
    return "design";
  }
  if (note.category === "retrieval") {
    return "retrieval";
  }
  if (note.category === "web-clips") {
    return "web-clips";
  }
  if (!note.relativePath.startsWith("notes/")) {
    return "pages";
  }
  return "unassigned";
}

function syncDocsConfig(allNotes, existingConfig) {
  const config = existingConfig || defaultDocsConfig();
  config.meta ||= defaultDocsConfig().meta;
  config.sections ||= defaultDocsConfig().sections;
  config.entries ||= [];

  const noteByPath = new Map(allNotes.map((note) => [note.relativePath, note]));
  const validSectionIds = new Set(config.sections.map((section) => section.id));
  const existingEntriesByPath = new Map(config.entries.map((entry) => [entry.path, entry]));

  const syncedEntries = [];

  for (const note of allNotes) {
    const current = existingEntriesByPath.get(note.relativePath) || {};
    const inferredSection = inferSectionId(note);
    const section = validSectionIds.has(current.section) ? current.section : inferredSection;

    syncedEntries.push({
      path: note.relativePath,
      title: current.title || note.title,
      shortTitle: current.shortTitle || "",
      description: current.description || note.summary || "",
      section,
      order: Number.isFinite(current.order) ? current.order : inferEntryOrder(note, section),
      featured: current.featured === true,
      hidden: current.hidden === true,
    });
  }

  config.entries = syncedEntries.sort((a, b) => {
    if (a.section !== b.section) {
      return a.section.localeCompare(b.section, "zh-Hans-CN");
    }
    if (a.order !== b.order) {
      return a.order - b.order;
    }
    return a.path.localeCompare(b.path, "zh-Hans-CN");
  });

  return config;
}

function inferEntryOrder(note, section) {
  if (section === "start") {
    return 10;
  }
  return Number(String(note.updatedAt).replace(/\D/g, "").slice(0, 12)) * -1;
}

function sortSections(sections) {
  return [...sections].sort((a, b) => {
    if (a.order !== b.order) {
      return a.order - b.order;
    }
    return a.title.localeCompare(b.title, "zh-Hans-CN");
  });
}

function sortEntries(entries) {
  return [...entries].sort((a, b) => {
    if (a.order !== b.order) {
      return a.order - b.order;
    }
    return a.title.localeCompare(b.title, "zh-Hans-CN");
  });
}

function buildKnowledgeIndex(allNotes, managedEntries, managedSections) {
  const indexLines = [
    "---",
    'title: "知识库目录"',
    'description: "由 docs.json 驱动的个人知识库目录"',
    "---",
    "",
    "# 知识库目录",
    "",
    `当前共收录 **${allNotes.length}** 篇文档，其中知识库文档 **${managedEntries.length}** 篇。目录结构由 \`data/docs.json\` 决定。`,
    "",
    "## 最近更新",
    "",
  ];

  for (const entry of [...managedEntries]
    .sort((a, b) => String(b.note.updatedAt).localeCompare(String(a.note.updatedAt)))
    .slice(0, 10)) {
    indexLines.push(
      `- [${entry.title}](${entry.note.url}) · ${formatDate(entry.note.updatedAt)}${entry.note.summary ? ` · ${entry.note.summary}` : ""}`
    );
  }

  for (const section of sortSections(managedSections)) {
    const entries = sortEntries(managedEntries.filter((entry) => entry.section?.id === section.id));
    if (entries.length === 0) {
      continue;
    }

    indexLines.push("", `## ${section.title}`, "");
    if (section.description) {
      indexLines.push(section.description, "");
    }

    for (const entry of entries) {
      const tagText = entry.note.tags.length ? ` · 标签：${entry.note.tags.join("、")}` : "";
      indexLines.push(`- [${entry.title}](${entry.note.url})${tagText}`);
    }
  }

  writeText(path.join(process.cwd(), "notes", "index.md"), `${indexLines.join("\n")}\n`);
}

function buildNavigation(managedEntries, managedSections) {
  const managedGroups = sortSections(managedSections)
    .map((section) => {
      const entries = sortEntries(managedEntries.filter((entry) => entry.section?.id === section.id));
      if (entries.length === 0) {
        return null;
      }

      return {
        text: section.title,
        items: entries.map((entry) => ({
          text: entry.shortTitle || entry.title,
          link: entry.note.url,
        })),
      };
    })
    .filter(Boolean);
  const navItems = [
    { text: "首页", link: "/" },
    { text: "知识库", link: "/notes/" },
  ];

  const sidebarItems = {
    "/notes/": [
      {
        text: "知识库目录",
        items: [{ text: "总览", link: "/notes/" }],
      },
      ...managedGroups.map((group) => ({
        text: group.text,
        items: group.items,
      })),
    ],
  };

  writeText(
    path.join(generatedDir, "kb.mjs"),
    `export const kbNav = ${JSON.stringify(navItems, null, 2)};\n\nexport const kbSidebar = ${JSON.stringify(
      sidebarItems,
      null,
      2
    )};\n`
  );
}
