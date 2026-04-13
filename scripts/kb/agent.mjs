import fs from "node:fs";
import path from "node:path";
import {
  getAllNotes,
  makeNoteDocument,
  notesDir,
  parseArgs,
  parseFrontmatter,
  readText,
  runKbBuild,
  searchNotes,
  shouldBuildFromArgs,
  slugify,
  splitList,
  toFrontmatter,
  writeText,
} from "./shared.mjs";
import { ingestUrl, inspectUrl } from "./url.mjs";

function printAndExit(payload, code = 0) {
  console.log(`${JSON.stringify(payload, null, 2)}\n`);
  process.exit(code);
}

function findTargetNote(noteRef) {
  const notes = getAllNotes();
  const normalizedRef = String(noteRef || "").trim();
  const normalizedSlug = slugify(normalizedRef);

  const exactMatch = notes.find(
    (note) =>
      note.relativePath === normalizedRef ||
      note.id === normalizedRef ||
      path.basename(note.relativePath, ".md") === normalizedRef ||
      note.title === normalizedRef ||
      slugify(path.basename(note.relativePath, ".md")) === normalizedSlug ||
      slugify(note.title) === normalizedSlug
  );

  if (exactMatch) {
    return exactMatch;
  }

  return notes.find(
    (note) =>
      note.title.includes(normalizedRef) ||
      note.relativePath.includes(normalizedRef) ||
      path.basename(note.relativePath, ".md").includes(normalizedRef)
  );
}

function compactResult(note) {
  return {
    title: note.title,
    path: note.relativePath,
    url: note.url,
    summary: note.summary,
    tags: note.tags,
    headings: note.headings.slice(0, 6),
    excerpt: note.snippet,
    updatedAt: note.updatedAt,
    score: note.score,
  };
}

function compactUrlResult(result) {
  const { html, ...rest } = result || {};
  return rest;
}

const args = parseArgs(process.argv.slice(2));
const action = String(args.action || args.mode || "").trim();

if (!action) {
  printAndExit(
    {
      ok: false,
      error: "Missing --action",
      supportedActions: ["retrieve", "add", "append", "update-meta", "delete", "inspect-url", "ingest-url", "build"],
    },
    1
  );
}

if (action === "retrieve") {
  const query = String(args.query || args.question || "").trim();
  const limit = Number(args.limit || 5);

  if (!query) {
    printAndExit({ ok: false, error: "Missing --query for retrieve action." }, 1);
  }

  const notes = getAllNotes();
  const results = searchNotes(notes, query, limit).map(compactResult);

  printAndExit({
    ok: true,
    action,
    query,
    strategy: "keyword-first retrieval with compact summaries and snippets",
    answerGuidance: [
      "Only answer from the returned notes.",
      "If the results are weak or incomplete, say so explicitly.",
      "Prefer citing note titles and paths instead of inventing details.",
      "Use the summary first and the excerpt second to save tokens.",
    ],
    results,
  });
}

if (action === "add") {
  const title = String(args.title || "").trim();

  if (!title) {
    printAndExit({ ok: false, error: "Missing --title for add action." }, 1);
  }

  const category = slugify(args.category || "inbox");
  const slug = slugify(args.slug || title);
  const fileDir = path.join(notesDir, category);
  let filePath = path.join(fileDir, `${slug}.md`);
  let duplicateCount = 1;

  while (findTargetNote(path.relative(process.cwd(), filePath).replace(/\\/g, "/"))) {
    duplicateCount += 1;
    filePath = path.join(fileDir, `${slug}-${duplicateCount}.md`);
  }

  const now = new Date().toISOString();
  const summary = args.summary ? String(args.summary).trim() : "";
  const tags = splitList(args.tags);
  const aliases = splitList(args.aliases);
  const content = args.content ? String(args.content).trim() : "在这里补充笔记内容。";
  const buildTriggered = shouldBuildFromArgs(args, false);

  const document = makeNoteDocument(
    {
      title,
      summary,
      tags,
      aliases,
      category,
      createdAt: now,
      updatedAt: now,
    },
    `# ${title}\n\n${content}\n`
  );

  writeText(filePath, document);
  if (buildTriggered) {
    runKbBuild();
  }

  printAndExit({
    ok: true,
    action,
    title,
    path: path.relative(process.cwd(), filePath).replace(/\\/g, "/"),
    category,
    buildTriggered,
  });
}

if (action === "append") {
  const noteRef = String(args.file || args.id || args.slug || args.title || "").trim();
  const append = String(args.append || args.content || "").trim();

  if (!noteRef || !append) {
    printAndExit(
      { ok: false, error: "append action requires --file/--id/--slug/--title and --append." },
      1
    );
  }

  const target = findTargetNote(noteRef);
  if (!target) {
    printAndExit({ ok: false, error: `Note not found: ${noteRef}` }, 1);
  }

  const raw = readText(target.absolutePath);
  const { data, body } = parseFrontmatter(raw);
  const nextFrontmatter = { ...data, updatedAt: new Date().toISOString() };
  const appendHeading = args.section
    ? `## ${String(args.section).trim()}`
    : `## 更新 ${String(nextFrontmatter.updatedAt).slice(0, 10)}`;
  const nextBody = `${body.trimEnd()}\n\n${appendHeading}\n\n${append}\n`;
  const buildTriggered = shouldBuildFromArgs(args, false);

  writeText(target.absolutePath, `${toFrontmatter(nextFrontmatter)}${nextBody}`);
  if (buildTriggered) {
    runKbBuild();
  }

  printAndExit({
    ok: true,
    action,
    path: target.relativePath,
    section: String(args.section || "").trim() || null,
    buildTriggered,
  });
}

if (action === "update-meta") {
  const noteRef = String(args.file || args.id || args.slug || args.title || "").trim();

  if (!noteRef) {
    printAndExit({ ok: false, error: "update-meta action requires a note reference." }, 1);
  }

  const target = findTargetNote(noteRef);
  if (!target) {
    printAndExit({ ok: false, error: `Note not found: ${noteRef}` }, 1);
  }

  const raw = readText(target.absolutePath);
  const { data, body } = parseFrontmatter(raw);
  const nextFrontmatter = { ...data, updatedAt: new Date().toISOString() };
  const buildTriggered = shouldBuildFromArgs(args, false);

  if (args.newTitle || args.title) {
    nextFrontmatter.title = String(args.newTitle || args.title).trim();
  }
  if (args.summary) {
    nextFrontmatter.summary = String(args.summary).trim();
  }
  if (args.tags) {
    nextFrontmatter.tags = splitList(args.tags);
  }
  if (args.aliases) {
    nextFrontmatter.aliases = splitList(args.aliases);
  }
  if (args.category) {
    nextFrontmatter.category = slugify(args.category);
  }

  writeText(target.absolutePath, `${toFrontmatter(nextFrontmatter)}${body.trimEnd()}\n`);
  if (buildTriggered) {
    runKbBuild();
  }

  printAndExit({
    ok: true,
    action,
    path: target.relativePath,
    updatedFields: Object.keys(nextFrontmatter).filter((key) => nextFrontmatter[key] !== data[key]),
    buildTriggered,
  });
}

if (action === "delete") {
  const noteRef = String(args.file || args.id || args.slug || args.title || "").trim();

  if (!noteRef) {
    printAndExit({ ok: false, error: "delete action requires a note reference." }, 1);
  }

  const target = findTargetNote(noteRef);
  if (!target) {
    printAndExit({ ok: false, error: `Note not found: ${noteRef}` }, 1);
  }

  const buildTriggered = shouldBuildFromArgs(args, false);
  fs.unlinkSync(target.absolutePath);

  if (buildTriggered) {
    runKbBuild();
  }

  printAndExit({
    ok: true,
    action,
    path: target.relativePath,
    buildTriggered,
  });
}

if (action === "inspect-url") {
  const url = String(args.url || "").trim();
  if (!url) {
    printAndExit({ ok: false, error: "inspect-url action requires --url." }, 1);
  }

  const result = inspectUrl(url, args);
  printAndExit(compactUrlResult(result), result.ok ? 0 : 1);
}

if (action === "ingest-url") {
  const url = String(args.url || "").trim();
  if (!url) {
    printAndExit({ ok: false, error: "ingest-url action requires --url." }, 1);
  }

  const result = ingestUrl(url, args);
  printAndExit(result, result.ok ? 0 : 1);
}

if (action === "build") {
  runKbBuild();
  printAndExit({
    ok: true,
    action,
    message: "Knowledge base built.",
  });
}

printAndExit(
  {
    ok: false,
    error: `Unsupported action: ${action}`,
    supportedActions: ["retrieve", "add", "append", "update-meta", "delete", "inspect-url", "ingest-url", "build"],
  },
  1
);
