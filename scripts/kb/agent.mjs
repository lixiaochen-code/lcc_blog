import { buildAnswerContext, loadKnowledgeBase, parseArgs, searchKnowledgeBase } from "./core.mjs";

function printJson(payload) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

const args = parseArgs(process.argv.slice(2));
const action = String(args.action || "retrieve").trim();
const query = String(args.query || args.q || args._.join(" ") || "").trim();
const base = loadKnowledgeBase();

if (!base) {
  printJson({
    ok: false,
    error: "knowledge-base.json 不存在，请先运行 pnpm kb:build",
  });
  process.exit(1);
}

if (action === "retrieve") {
  const matches = searchKnowledgeBase(base, query, Number(args.limit || 5));
  const context = buildAnswerContext(query, matches);
  printJson({
    ok: true,
    action,
    query,
    context,
    hits: matches.map((item) => ({
      id: item.id,
      title: item.title,
      summary: item.summary,
      url: item.url,
      tags: item.tags,
      section: item.sectionTitle,
      score: item.score,
    })),
  });
  process.exit(0);
}

printJson({
  ok: false,
  action,
  error: `当前重构版本只保留 retrieve 动作。收到未支持动作：${action}`,
  supportedActions: ["retrieve"],
});
process.exit(1);
