import { buildAnswerContext, loadKnowledgeBase, parseArgs, searchKnowledgeBase } from "./core.mjs";

const args = parseArgs(process.argv.slice(2));
const query = String(args.query || args.q || args._.join(" ") || "").trim();
const limit = Number(args.limit || 4);
const base = loadKnowledgeBase();

if (!base) {
  console.error("knowledge-base.json 不存在，请先运行 pnpm kb:build");
  process.exit(1);
}

if (!query) {
  console.error("请提供检索词，例如：pnpm kb:context Vite 插件");
  process.exit(1);
}

const matches = searchKnowledgeBase(base, query, limit);
process.stdout.write(`${buildAnswerContext(query, matches)}\n`);
