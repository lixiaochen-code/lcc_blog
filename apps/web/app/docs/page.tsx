import Link from "next/link";
import { docs } from "../../lib/site-data";

export default function DocsIndexPage() {
  return (
    <div className="docs-layout">
      <aside className="docs-sidebar">
        <h2>目录</h2>
        <ul>
          {docs.map((doc) => (
            <li key={doc.slug.join("/")}>
              <Link href={`/docs/${doc.slug.join("/")}`}>{doc.title}</Link>
            </li>
          ))}
        </ul>
      </aside>

      <section className="docs-content">
        <h1>文档中心</h1>
        <p>
          当前为 docs layout 壳体，后续将接入真实文档目录、分类和 sidebar
          管理结果。
        </p>
        <div className="card-grid">
          {docs.map((doc) => (
            <article className="doc-card" key={doc.slug.join("/")}>
              <div className="doc-card__meta">
                <span className="pill">{doc.section}</span>
                <span>{doc.readingTime}</span>
              </div>
              <h2>{doc.title}</h2>
              <p>{doc.summary}</p>
              <Link
                className="button-link button-link--secondary"
                href={`/docs/${doc.slug.join("/")}`}
              >
                查看详情
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
