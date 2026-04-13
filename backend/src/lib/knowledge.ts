import fs from "node:fs";
import path from "node:path";
import type { KnowledgeBase, KnowledgeNote } from "./types.js";

const projectRoot = process.cwd();
const knowledgeFile = path.join(projectRoot, "data", "knowledge-base.json");

function tokenize(input: string) {
  const matches = input.toLowerCase().match(/[\p{sc=Han}]{1,}|[a-z0-9]+/gu) ?? [];
  const expanded: string[] = [];

  for (const token of matches) {
    expanded.push(token);
    if (/^[\p{sc=Han}]+$/u.test(token) && token.length > 2) {
      for (let index = 0; index < token.length - 1; index += 1) {
        expanded.push(token.slice(index, index + 2));
      }
    }
  }

  return [...new Set(expanded.filter(Boolean))];
}

function score(note: KnowledgeNote, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return 0;
  }

  const title = note.title.toLowerCase();
  const summary = note.summary.toLowerCase();
  const aliases = note.aliases.join(" ").toLowerCase();
  const tags = note.tags.join(" ").toLowerCase();
  const body = note.plainText.toLowerCase();
  const haystack = `${title} ${summary} ${aliases} ${tags} ${body}`;
  let total = 0;

  if (title.includes(normalizedQuery)) total += 120;
  if (summary.includes(normalizedQuery)) total += 60;
  if (tags.includes(normalizedQuery)) total += 40;
  if (aliases.includes(normalizedQuery)) total += 32;
  if (haystack.includes(normalizedQuery)) total += 16;

  let matched = 0;
  const tokens = tokenize(normalizedQuery);
  for (const token of tokens) {
    if (title.includes(token)) {
      total += 28;
      matched += 1;
      continue;
    }
    if (tags.includes(token)) {
      total += 20;
      matched += 1;
      continue;
    }
    if (summary.includes(token)) {
      total += 12;
      matched += 1;
      continue;
    }
    if (haystack.includes(token)) {
      total += 6;
      matched += 1;
    }
  }

  if (tokens.length > 1 && matched === tokens.length) {
    total += 20;
  }

  return total;
}

export function loadKnowledgeBase(): KnowledgeBase {
  const raw = fs.readFileSync(knowledgeFile, "utf8");
  return JSON.parse(raw) as KnowledgeBase;
}

export function listNotes(base: KnowledgeBase, options?: { section?: string; tag?: string; limit?: number }) {
  const section = String(options?.section ?? "").trim();
  const tag = String(options?.tag ?? "").trim();
  const limit = Number(options?.limit ?? 50);

  return base.notes
    .filter((note) => (section ? note.sectionId === section : true))
    .filter((note) => (tag ? note.tags.includes(tag) : true))
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
    .slice(0, limit);
}

export function searchNotes(base: KnowledgeBase, query: string, limit = 5) {
  const normalizedQuery = String(query || "").trim();
  if (!normalizedQuery) {
    return listNotes(base, { limit }).map((note) => ({ note, score: 0 }));
  }

  return base.notes
    .map((note) => ({ note, score: score(note, normalizedQuery) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || String(b.note.updatedAt).localeCompare(String(a.note.updatedAt)))
    .slice(0, limit);
}

export function findNote(base: KnowledgeBase, id: string) {
  const target = String(id || "").trim();
  return base.notes.find((note) => note.id === target) ?? null;
}

export function createContext(query: string, matches: Array<{ note: KnowledgeNote; score: number }>) {
  const lines = [`问题：${query}`, "", "参考资料：", ""];

  for (const item of matches) {
    const note = item.note;
    lines.push(`- 标题：${note.title}`);
    lines.push(`  路径：${note.url}`);
    lines.push(`  分区：${note.sectionTitle}`);
    lines.push(`  标签：${note.tags.join("、") || "无"}`);
    lines.push(`  摘要：${note.summary}`);
    lines.push(`  内容摘录：${note.excerpt}`);
    lines.push("");
  }

  return lines.join("\n").trim();
}

export function createFallbackAnswer(query: string, matches: Array<{ note: KnowledgeNote; score: number }>) {
  if (!matches.length) {
    return {
      answer: `我没有在当前知识库里找到和“${query}”直接相关的笔记。你可以换个关键词，或者先补充一篇相关笔记后再问我。`,
      references: [],
    };
  }

  const top = matches[0].note;
  const references = matches.map((item) => ({
    id: item.note.id,
    title: item.note.title,
    url: item.note.url,
  }));

  const bullets = matches
    .slice(0, 3)
    .map((item) => `- ${item.note.title}：${item.note.summary}`)
    .join("\n");

  return {
    answer: [
      `根据当前知识库，和“${query}”最相关的是《${top.title}》。`,
      "",
      "我先给你一个基于检索结果的整理版回答：",
      bullets,
      "",
      `如果你想继续深挖，建议先阅读 ${references.map((item) => `《${item.title}》`).join("、")}。`,
    ].join("\n"),
    references,
  };
}
