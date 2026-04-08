import { getAllNotes, searchNotes } from "./shared.mjs";

const argv = process.argv.slice(2);
const query = argv.join(" ").trim();

if (!query) {
  console.error("Usage: pnpm kb:context <query>");
  process.exit(1);
}

const notes = getAllNotes();
const results = searchNotes(notes, query, 5).map((note) => ({
  title: note.title,
  path: note.relativePath,
  url: note.url,
  summary: note.summary,
  tags: note.tags,
  headings: note.headings.slice(0, 6),
  excerpt: note.snippet,
  updatedAt: note.updatedAt,
  score: note.score,
}));

console.log(
  JSON.stringify(
    {
      query,
      strategy: "keyword-first retrieval with compact note summaries",
      results,
    },
    null,
    2
  )
);
