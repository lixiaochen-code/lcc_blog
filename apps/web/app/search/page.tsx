import Link from "next/link";
import type { SearchResultItem } from "@lcc-blog/db/search";
import { getCurrentSession } from "../../lib/auth";
import { executeSearch } from "../../lib/search";

interface SearchPageProps {
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const session = await getCurrentSession();
  const { q = "", page = "1", pageSize = "10" } = await searchParams;
  const result = executeSearch({
    query: q,
    page: Number(page),
    pageSize: Number(pageSize),
    session
  });

  const previousPage = result.page > 1 ? result.page - 1 : null;
  const nextPage = result.page < result.totalPages ? result.page + 1 : null;

  return (
    <div className="search-layout">
      <section className="search-panel">
        <h1>搜索</h1>
        <p>
          当前搜索基于关键词匹配与 excerpt 摘录，按当前访问权限过滤可见文档。
        </p>
        <form action="/search" method="get">
          <input
            defaultValue={q}
            name="q"
            placeholder="输入关键词，例如：AI、内容治理、搜索"
          />
          <input name="pageSize" type="hidden" value={result.pageSize} />
          <button className="button-link button-link--primary" type="submit">
            搜索
          </button>
        </form>
        <p>
          查询词：<strong>{q || "未输入"}</strong> · 共 {result.total} 条结果
        </p>
      </section>

      {result.items.length === 0 ? (
        <section className="empty-card">
          <h2>没有找到结果</h2>
          <p>试试更宽泛的关键词，或者回到文档中心浏览当前已有示例内容。</p>
          <Link className="button-link button-link--secondary" href="/docs">
            前往文档中心
          </Link>
        </section>
      ) : (
        <section className="search-result-list">
          {result.items.map((doc: SearchResultItem) => (
            <article className="search-result" key={doc.id}>
              <div className="search-result__meta">
                <span className="pill">score {doc.score}</span>
                <span>{doc.status}</span>
                <span>{doc.visibility}</span>
              </div>
              <h2>{doc.title}</h2>
              <p>{doc.summary}</p>
              <p className="search-result__excerpt">{doc.excerpt}</p>
              <div className="search-result__meta">
                <span>
                  分类：
                  {doc.categories
                    .map((item: { name: string }) => item.name)
                    .join(" / ") || "无"}
                </span>
                <span>
                  标签：
                  {doc.tags
                    .map((item: { name: string }) => item.name)
                    .join(" / ") || "无"}
                </span>
              </div>
              <Link
                className="button-link button-link--secondary"
                href={`/docs/${doc.slug}`}
              >
                查看文档详情
              </Link>
            </article>
          ))}

          <div className="search-pagination">
            {previousPage ? (
              <Link
                className="button-link button-link--secondary"
                href={`/search?q=${encodeURIComponent(q)}&page=${previousPage}&pageSize=${result.pageSize}`}
              >
                上一页
              </Link>
            ) : (
              <span className="search-pagination__status">第一页</span>
            )}

            <span className="search-pagination__status">
              第 {result.page} / {Math.max(result.totalPages, 1)} 页
            </span>

            {nextPage ? (
              <Link
                className="button-link button-link--secondary"
                href={`/search?q=${encodeURIComponent(q)}&page=${nextPage}&pageSize=${result.pageSize}`}
              >
                下一页
              </Link>
            ) : (
              <span className="search-pagination__status">最后一页</span>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
