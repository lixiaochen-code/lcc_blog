import fs from "node:fs";
import path from "node:path";
import {
  dataDir,
  buildKnowledgeBaseOverview,
  getAllNotes,
  isOverviewQuery,
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

const docsConfigPath = path.join(dataDir, "docs.json");

function inferSectionIdFromNote(note) {
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
  if (note.category === "frontend") {
    return "frontend";
  }
  if (note.category === "tools") {
    return "tools";
  }
  if (note.category === "web-clips") {
    return "web-clips";
  }
  if (!note.relativePath.startsWith("notes/")) {
    return "pages";
  }
  return "unassigned";
}

function resolveSectionId(sectionRef, config, note) {
  const sections = Array.isArray(config?.sections) ? config.sections : [];
  const normalizedRef = String(sectionRef || "").trim().toLowerCase();

  if (!normalizedRef) {
    return inferSectionIdFromNote(note);
  }

  const matched = sections.find((section) => {
    const id = String(section.id || "").trim().toLowerCase();
    const title = String(section.title || "").trim().toLowerCase();
    return id === normalizedRef || title === normalizedRef;
  });

  return matched?.id || inferSectionIdFromNote(note);
}

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
      supportedActions: [
        "retrieve",
        "add",
        "append",
        "append-from-url",
        "organize-entry",
        "update-meta",
        "delete",
        "inspect-url",
        "ingest-url",
        "build",
      ],
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
  const overviewRequested =
    shouldBuildFromArgs({ build: args.overview }, false) ||
    isOverviewQuery(query);

  if (overviewRequested) {
    const overview = buildKnowledgeBaseOverview(notes, { latestLimit: limit });
    printAndExit({
      ok: true,
      action,
      query,
      mode: "overview",
      strategy: "knowledge-base overview with latest notes and category distribution",
      answerGuidance: [
        "Answer from the overview only.",
        "Prefer mentioning category counts and recently updated notes.",
        "If the user wants details about one topic, suggest a narrower retrieval query.",
      ],
      overview,
      results: overview.latestNotes,
    });
  }

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

if (action === "append-from-url") {
  const noteRef = String(args.file || args.id || args.slug || args.title || args.target || "").trim();
  const url = String(args.url || "").trim();

  if (!noteRef || !url) {
    printAndExit(
      {
        ok: false,
        error: "append-from-url action requires a note reference and --url.",
      },
      1
    );
  }

  const target = findTargetNote(noteRef);
  if (!target) {
    printAndExit({ ok: false, error: `Note not found: ${noteRef}` }, 1);
  }

  const inspected = inspectUrl(url, args);
  if (!inspected.ok || !inspected.article) {
    printAndExit(
      {
        ok: false,
        action,
        error: inspected.error || "Failed to inspect URL.",
        result: compactUrlResult(inspected),
      },
      1
    );
  }

  const raw = readText(target.absolutePath);
  const { data, body } = parseFrontmatter(raw);
  const updatedAt = new Date().toISOString();
  const nextFrontmatter = { ...data, updatedAt };
  const sectionTitle = String(args.section || "").trim() || `外部资料补充 ${updatedAt.slice(0, 10)}`;
  const contentMode = String(args.contentMode || args.mode || "").trim().toLowerCase();
  const article = inspected.article;
  const summary = String(
    args.summary ||
    article.description ||
    article.excerpt ||
    ""
  ).trim();
  const excerptSource = String(article.contentMarkdown || article.plainText || "").trim();
  const excerpt =
    contentMode === "full"
      ? excerptSource
      : excerptSource.slice(0, Number(args.maxChars || 1200)).trim();

  const appendLines = [
    `## ${sectionTitle}`,
    "",
    `> 来源：[${article.title || article.siteName || article.url}](${article.url})`,
    article.siteName ? `> 站点：${article.siteName}` : "",
    article.author ? `> 作者：${article.author}` : "",
    article.publishedAt ? `> 发布时间：${article.publishedAt}` : "",
    `> 抓取方式：${inspected.strategy}`,
    summary ? `> 摘要：${summary}` : "",
    "",
    excerpt,
    "",
  ].filter(Boolean);

  const nextBody = `${body.trimEnd()}\n\n${appendLines.join("\n")}\n`;
  const buildTriggered = shouldBuildFromArgs(args, false);

  writeText(target.absolutePath, `${toFrontmatter(nextFrontmatter)}${nextBody}`);
  if (buildTriggered) {
    runKbBuild();
  }

  printAndExit({
    ok: true,
    action,
    path: target.relativePath,
    sourceUrl: article.url,
    sourceTitle: article.title || article.siteName || article.url,
    section: sectionTitle,
    contentMode: contentMode === "full" ? "full" : "summary",
    buildTriggered,
  });
}

if (action === "organize-entry") {
  const noteRef = String(args.file || args.id || args.slug || args.title || args.target || "").trim();

  if (!noteRef) {
    printAndExit({ ok: false, error: "organize-entry action requires a note reference." }, 1);
  }

  const target = findTargetNote(noteRef);
  if (!target) {
    printAndExit({ ok: false, error: `Note not found: ${noteRef}` }, 1);
  }

  const config = JSON.parse(readText(docsConfigPath));
  config.sections ||= [];
  config.entries ||= [];

  const nextSection = resolveSectionId(args.section || args.destination || "", config, target);
  const sectionMeta = config.sections.find((item) => item.id === nextSection) || null;
  const existingEntry = config.entries.find((item) => item.path === target.relativePath);
  const nextEntry = {
    ...(existingEntry || {}),
    path: target.relativePath,
    title: existingEntry?.title || target.title,
    shortTitle: existingEntry?.shortTitle || "",
    description: existingEntry?.description || target.summary || "",
    section: nextSection,
    order: Number.isFinite(existingEntry?.order) ? existingEntry.order : Date.now(),
    featured: Boolean(existingEntry?.featured),
    hidden: Boolean(existingEntry?.hidden),
  };

  if (existingEntry) {
    Object.assign(existingEntry, nextEntry);
  } else {
    config.entries.push(nextEntry);
  }

  writeText(docsConfigPath, `${JSON.stringify(config, null, 2)}\n`);
  const buildTriggered = shouldBuildFromArgs(args, true);

  if (buildTriggered) {
    runKbBuild();
  }

  printAndExit({
    ok: true,
    action,
    path: target.relativePath,
    title: target.title,
    section: nextSection,
    sectionTitle: sectionMeta?.title || nextSection,
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
    supportedActions: [
      "retrieve",
      "add",
      "append",
      "append-from-url",
      "organize-entry",
      "update-meta",
      "delete",
      "inspect-url",
      "ingest-url",
      "build",
    ],
  },
  1
);
