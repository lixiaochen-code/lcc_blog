import Link from "next/link";
import { executeAiSearch } from "../../../lib/ai-search";
import { getCurrentSession, requirePermission } from "../../../lib/auth";

const modeLabels = {
  search: "AI 检索",
  ask: "AI 问答",
  summarize: "AI 摘要"
} as const;

type SearchMode = keyof typeof modeLabels;

interface AiSearchPageProps {
  searchParams: Promise<{ q?: string; mode?: string; topK?: string }>;
}

type AiSearchResponse = Awaited<ReturnType<typeof executeAiSearch>>;

function parseMode(value?: string): SearchMode {
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
    <div className="ai-search-layout">
      <section className="search-panel ai-search-panel">
        <div className="ai-search-panel__copy">
          <span className="pill">只读 AI</span>
          <h1>AI 搜索工作台</h1>
          <p>
            面向已登录成员开放的知识库检索、问答和摘要入口。回答会附带来源引用，且只使用你当前权限可见的文档。
          </p>
        </div>

        <form action="/ai/search" className="ai-search-form" method="get">
          <label>
            <span>问题或检索意图</span>
            <input
              defaultValue={q}
              name="q"
              placeholder="例如：AI 搜索如何使用 FULLTEXT 召回？"
            />
          </label>

          <label>
            <span>模式</span>
            <select defaultValue={mode} name="mode">
              {Object.entries(modeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>召回条数</span>
            <input
              defaultValue={topK}
              max={5}
              min={1}
              name="topK"
              type="number"
            />
          </label>

          <button className="button-link button-link--primary" type="submit">
            开始生成
          </button>
        </form>
      </section>

      {!shouldSearch ? (
        <section className="empty-card">
          <h2>准备开始一次 AI 检索</h2>
          <p>
            输入问题后，系统会先做关键词召回，再根据上下文生成带引用的回答。
          </p>
        </section>
      ) : errorMessage ? (
        <section className="error-card">
          <h2>AI 搜索未完成</h2>
          <p>{errorMessage}</p>
        </section>
      ) : result ? (
        <>
          <section className="ai-answer-card">
            <div className="search-result__meta">
              <span className="pill">{modeLabels[mode]}</span>
              <span>provider {result.provider.name}</span>
              <span>model {result.provider.model}</span>
              <span>task {result.taskId}</span>
            </div>
            <h2>回答</h2>
            <p>{result.answer}</p>
          </section>

          <section className="ai-search-sections">
            <article className="search-result">
              <h2>来源引用</h2>
              <ul>
                {result.citations.map((citation, index) => (
                  <li key={citation.documentId}>
                    <strong>
                      [{index + 1}] {citation.title}
                    </strong>
                    <p>{citation.excerpt}</p>
                    <Link
                      className="button-link button-link--secondary"
                      href={`/docs/${citation.slug}`}
                    >
                      查看原文
                    </Link>
                  </li>
                ))}
              </ul>
            </article>

            <article className="search-result">
              <h2>相关文档</h2>
              <ul>
                {result.relatedDocuments.map((document) => (
                  <li key={document.id}>
                    <div className="search-result__meta">
                      <span className="pill">score {document.score}</span>
                      <span>{document.visibility}</span>
                      <span>{document.status}</span>
                    </div>
                    <strong>{document.title}</strong>
                    <p>{document.summary}</p>
                  </li>
                ))}
              </ul>
            </article>
          </section>
        </>
      ) : null}
    </div>
  );
}
