import path from "node:path";
import {
  getAllNotes,
  parseArgs,
  parseFrontmatter,
  readText,
  runKbBuild,
  splitList,
  toFrontmatter,
  writeText,
} from "./shared.mjs";

const args = parseArgs(process.argv.slice(2));
const noteRef = args.file || args.id || args.slug;

if (!noteRef) {
  console.error("Provide --file, --id, or --slug to update a note.");
  process.exit(1);
}

const notes = getAllNotes();
const target = notes.find(
  (note) =>
    note.relativePath === noteRef ||
    note.id === noteRef ||
    path.basename(note.relativePath, ".md") === noteRef
);

if (!target) {
  console.error(`Note not found: ${noteRef}`);
  process.exit(1);
}

const raw = readText(target.absolutePath);
const { data, body } = parseFrontmatter(raw);
const nextFrontmatter = { ...data };

if (args.title) {
  nextFrontmatter.title = String(args.title).trim();
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

nextFrontmatter.updatedAt = new Date().toISOString();

let nextBody = body.trimEnd();

if (args.append) {
  const appendHeading = args.section
    ? `## ${String(args.section).trim()}`
    : `## 更新 ${String(nextFrontmatter.updatedAt).slice(0, 10)}`;
  nextBody = `${nextBody}\n\n${appendHeading}\n\n${String(args.append).trim()}\n`;
}

if (args["replace-body"]) {
  nextBody = String(args["replace-body"]).trim();
}

writeText(target.absolutePath, `${toFrontmatter(nextFrontmatter)}${nextBody}\n`);
runKbBuild();

console.log(path.relative(process.cwd(), target.absolutePath));
