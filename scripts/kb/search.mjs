import { loadKnowledgeBase, parseArgs, searchKnowledgeBase } from "./core.mjs";

const args = parseArgs(process.argv.slice(2));
const query = String(args.query || args.q || args._.join(" ") || "").trim();
const limit = Number(args.limit || 5);
const base = loadKnowledgeBase();

if (!base) {
  console.error("knowledge-base.json 不存在，请先运行 pnpm kb:build");
  process.exit(1);
}

const results = searchKnowledgeBase(base, query, limit).map((item) => ({
  id: item.id,
  title: item.title,
  summary: item.summary,
  section: item.sectionTitle,
  tags: item.tags,
  url: item.url,
  score: item.score,
}));

if (args.json || args.format === "json") {
  process.stdout.write(`${JSON.stringify({ query, total: results.length, results }, null, 2)}\n`);
  process.exit(0);
}

console.log(`检索词：${query || "（空，返回最近更新）"}`);
console.log("");

for (const [index, item] of results.entries()) {
  console.log(`${index + 1}. ${item.title}`);
  console.log(`   分区：${item.section}`);
  console.log(`   标签：${item.tags.join("、") || "无"}`);
  console.log(`   链接：${item.url}`);
  console.log(`   摘要：${item.summary}`);
  console.log("");
}
