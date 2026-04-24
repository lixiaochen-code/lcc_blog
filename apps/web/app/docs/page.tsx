import Link from "next/link";
import { DocsChrome } from "../../components/docs-chrome";
import { docs } from "../../lib/site-data";

export default function DocsIndexPage() {
  return (
    <DocsChrome>
      <article className="doc-article">
        <div className="doc-kicker">Docs</div>
        <h1>文档中心</h1>
        <p className="doc-lede">
          用文档目录组织知识，用搜索和 AI 检索补足发现路径。这里会逐步承载
          对话生成的草稿、人工确认后的正式文档，以及来自网络检索的引用材料。
        </p>

        <div className="doc-index-grid">
          {docs.map((doc) => (
            <Link
              className="doc-index-card"
              href={`/docs/${doc.slug.join("/")}`}
              key={doc.slug.join("/")}
            >
              <span>{doc.section}</span>
              <strong>{doc.title}</strong>
              <small>{doc.summary}</small>
            </Link>
          ))}
        </div>
      </article>
    </DocsChrome>
  );
}
