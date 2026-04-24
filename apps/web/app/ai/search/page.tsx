import type { AiSearchMode } from "@lcc-blog/db/ai-search";
import { AiSearchWorkspace } from "./ai-search-workspace";
import { executeAiSearch } from "../../../lib/ai-search";
import { getCurrentSession, requirePermission } from "../../../lib/auth";

interface AiSearchPageProps {
  searchParams: Promise<{ q?: string; mode?: string; topK?: string }>;
}

type AiSearchResponse = Awaited<ReturnType<typeof executeAiSearch>>;

function parseMode(value?: string): AiSearchMode {
  if (value === "ask" || value === "summarize") {
    return value;
  }

  return "search";
}

function parseTopK(value?: string) {
  const numeric = Number(value ?? "3");
  return Number.isFinite(numeric) ? Math.min(5, Math.max(1, numeric)) : 3;
}

export default async function AiSearchPage({
  searchParams
}: AiSearchPageProps) {
  await requirePermission("ai.search");
  const session = await getCurrentSession();

  const { q = "", mode: rawMode, topK: rawTopK } = await searchParams;
  const mode = parseMode(rawMode);
  const topK = parseTopK(rawTopK);
  const shouldSearch = q.trim().length > 0;
  let result: AiSearchResponse | null = null;
  let errorMessage: string | null = null;

  if (shouldSearch) {
    try {
      result = (await executeAiSearch({
        session,
        query: q,
        mode,
        topK
      })) as AiSearchResponse;
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : "AI 搜索请求失败";
    }
  }

  return (
    <AiSearchWorkspace
      initialErrorMessage={errorMessage}
      initialMode={mode}
      initialQuery={q}
      initialResult={result}
      initialTopK={topK}
    />
  );
}
