"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import type {
  AiSearchMode,
  AiSearchResponse
} from "@lcc-blog/db/ai-search";

const modeLabels = {
  search: "AI 检索",
  ask: "AI 问答",
  summarize: "AI 摘要"
} as const satisfies Record<AiSearchMode, string>;

interface AiSearchWorkspaceProps {
  initialQuery: string;
  initialMode: AiSearchMode;
  initialTopK: number;
  initialResult: AiSearchResponse | null;
  initialErrorMessage: string | null;
}

function buildQueryString(query: string, mode: AiSearchMode, topK: number) {
  const params = new URLSearchParams();
  params.set("q", query);
  params.set("mode", mode);
  params.set("topK", String(topK));
  return params.toString();
}

export function AiSearchWorkspace({
  initialQuery,
  initialMode,
  initialTopK,
  initialResult,
  initialErrorMessage
}: AiSearchWorkspaceProps) {
  const [query, setQuery] = useState(initialQuery);
  const [mode, setMode] = useState<AiSearchMode>(initialMode);
  const [topK, setTopK] = useState(initialTopK);
  const [result, setResult] = useState<AiSearchResponse | null>(initialResult);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    initialErrorMessage
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const shouldSearch = query.trim().length > 0;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setResult(null);
      setErrorMessage(null);
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/ai/search", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          query: trimmedQuery,
          mode,
          topK
        })
      });
      const payload = (await response.json()) as
        | AiSearchResponse
        | { message?: string };

      if (!response.ok) {
        throw new Error(
          "message" in payload && payload.message
            ? payload.message
            : "AI 搜索请求失败"
        );
      }

      const nextResult = payload as AiSearchResponse;
      setResult(nextResult);
      globalThis.history.replaceState(
        null,
        "",
        `/ai/search?${buildQueryString(trimmedQuery, mode, topK)}`
      );
    } catch (error) {
      setResult(null);
      setErrorMessage(error instanceof Error ? error.message : "AI 搜索请求失败");
    } finally {
      setIsGenerating(false);
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

        <form className="ai-search-form" onSubmit={handleSubmit}>
          <label>
            <span>问题或检索意图</span>
            <input
              name="q"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="例如：AI 搜索如何使用 FULLTEXT 召回？"
              value={query}
            />
          </label>

          <label>
            <span>模式</span>
            <select
              name="mode"
              onChange={(event) => setMode(event.target.value as AiSearchMode)}
              value={mode}
            >
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
              max={5}
              min={1}
              name="topK"
              onChange={(event) => {
                const numeric = Number(event.target.value);
                setTopK(Number.isFinite(numeric) ? numeric : 3);
              }}
              type="number"
              value={topK}
            />
          </label>

          <button
            className="button-link button-link--primary"
            disabled={isGenerating}
            type="submit"
          >
            {isGenerating ? "生成中..." : "开始生成"}
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
