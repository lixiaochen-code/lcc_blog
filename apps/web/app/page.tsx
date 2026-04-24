import Link from "next/link";
import { DocsChrome, getFirstDoc } from "../components/docs-chrome";
import { docs } from "../lib/site-data";

export default function HomePage() {
  const firstDoc = getFirstDoc();

  return (
    <DocsChrome currentDoc={firstDoc} currentSlug={firstDoc.slug.join("/")}>
      <article className="doc-article">
        <div className="doc-kicker">Knowledge Base</div>
        <h1>一个可随时迭代的知识库</h1>
        <p className="doc-lede">
          这里不再是博客首页，而是文档工作台。你可以通过明确指令让我新增、
          修改、删除和整理文档；需要外部资料时，再进入带来源引用的网络检索流程。
        </p>

        <div className="doc-actions">
          <Link className="button-link button-link--primary" href="/docs">
            浏览文档
          </Link>
          <Link className="button-link button-link--secondary" href="/search">
            搜索内容
          </Link>
        </div>

        <section id="文档优先">
          <h2>文档优先</h2>
          <p>
            页面结构参考 VitePress 和 Claude Docs：左侧是稳定目录，中间是正文，
            右侧是当前页导航。用户进入后先阅读和定位知识，而不是被营销页打断。
          </p>
        </section>

        <section id="对话更新">
          <h2>对话更新</h2>
          <p>
            AI 不会主动改写内容。只有当你明确要求新增、修改、删除或整理文档时，
            系统才会生成草稿或变更集，并等待确认后写入。
          </p>
        </section>

        <section id="网络检索">
          <h2>网络检索</h2>
          <p>
            需要查询最新资料时，网络检索会作为独立动作执行，结果应保留来源、
            摘要和引用，避免把未经确认的信息直接混进正式文档。
          </p>
        </section>

        <section id="人工确认">
          <h2>人工确认</h2>
          <p>
            文档写入应保持可回滚、可审计。后续可以继续接入审批、版本快照和
            发布记录，但第一步先把阅读和维护体验做顺。
          </p>
        </section>

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
