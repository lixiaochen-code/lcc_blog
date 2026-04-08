import fs from "node:fs";
import path from "node:path";
import {
  ensureDir,
  makeNoteDocument,
  notesDir,
  parseArgs,
  runKbBuild,
  slugify,
  splitList,
  writeText,
} from "./shared.mjs";

const args = parseArgs(process.argv.slice(2));
const title = String(args.title || "").trim();

if (!title) {
  console.error("Missing required argument: --title");
  process.exit(1);
}

const category = slugify(args.category || "inbox");
const slug = slugify(args.slug || title);
const fileDir = path.join(notesDir, category);
let filePath = path.join(fileDir, `${slug}.md`);

ensureDir(fileDir);

let duplicateCount = 1;
while (fs.existsSync(filePath)) {
  duplicateCount += 1;
  filePath = path.join(fileDir, `${slug}-${duplicateCount}.md`);
}

const now = new Date().toISOString();
const summary = args.summary ? String(args.summary).trim() : "";
const tags = splitList(args.tags);
const aliases = splitList(args.aliases);
const extraContent = args.content ? String(args.content).trim() : "在这里补充笔记内容。";

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
  `# ${title}\n\n${extraContent}\n`
);

writeText(filePath, document);
runKbBuild();

console.log(path.relative(process.cwd(), filePath));
