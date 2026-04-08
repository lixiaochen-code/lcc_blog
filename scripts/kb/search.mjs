import { getAllNotes, searchNotes } from "./shared.mjs";

const query = process.argv.slice(2).join(" ").trim();

if (!query) {
  console.error("Usage: pnpm kb:search <query>");
  process.exit(1);
}

const notes = getAllNotes();
const results = searchNotes(notes, query, 8);

if (results.length === 0) {
  console.log("No matching notes found.");
  process.exit(0);
}

for (const result of results) {
  console.log(`${result.title} (${result.relativePath})`);
  console.log(`  score: ${result.score}`);
  console.log(`  url: ${result.url}`);
  if (result.tags.length) {
    console.log(`  tags: ${result.tags.join(", ")}`);
  }
  if (result.summary) {
    console.log(`  summary: ${result.summary}`);
  }
  if (result.snippet) {
    console.log(`  snippet: ${result.snippet}`);
  }
  console.log("");
}
