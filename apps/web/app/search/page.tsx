import Link from "next/link";
import { searchDocs } from "../../lib/site-data";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "" } = await searchParams;
  const results = searchDocs(q);

  return (
    <div className="search-layout">
      <section className="search-panel">
        <h1>搜索</h1>
        <p>
          当前为搜索页壳体，使用静态示例文档模拟搜索结果。后续将接入真实搜索
          API。
        </p>
        <form action="/search" method="get">
          <input
            defaultValue={q}
            name="q"
            placeholder="输入关键词，例如：AI、内容治理、搜索"
          />
          <button className="button-link button-link--primary" type="submit">
            搜索
          </button>
        </form>
      </section>

      {results.length === 0 ? (
        <section className="empty-card">
          <h2>没有找到结果</h2>
          <p>试试更宽泛的关键词，或者回到文档中心浏览当前已有示例内容。</p>
          <Link className="button-link button-link--secondary" href="/docs">
            前往文档中心
          </Link>
        </section>
      ) : (
        <section className="search-result-list">
          {results.map((doc) => (
            <article className="search-result" key={doc.slug.join("/")}>
              <div className="search-result__meta">
                <span className="pill">{doc.section}</span>
                <span>{doc.readingTime}</span>
              </div>
              <h2>{doc.title}</h2>
              <p>{doc.summary}</p>
              <Link
                className="button-link button-link--secondary"
                href={`/docs/${doc.slug.join("/")}`}
              >
                查看文档详情
              </Link>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
