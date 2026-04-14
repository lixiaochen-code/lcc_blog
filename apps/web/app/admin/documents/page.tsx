import Link from "next/link";
import type { DocumentRecord } from "@lcc-blog/db/documents";
import { listDocuments } from "../../../lib/documents-client";

export default function AdminDocumentsPage() {
  const documents = listDocuments();

  return (
    <div className="search-layout">
      <section className="search-panel">
        <h1>后台文档管理</h1>
        <p>
          当前为文档 CRUD 管理壳体，后续会接入真实权限、表单提交和服务端校验。
        </p>
        <Link
          className="button-link button-link--primary"
          href="/admin/documents/new"
        >
          新建文档
        </Link>
      </section>

      <section className="search-result-list">
        {documents.map((document: DocumentRecord) => (
          <article className="search-result" key={document.id}>
            <div className="search-result__meta">
              <span className="pill">{document.status}</span>
              <span>{document.visibility}</span>
              <span>{document.format}</span>
            </div>
            <h2>{document.title}</h2>
            <p>{document.summary}</p>
            <div className="hero-actions">
              <Link
                className="button-link button-link--secondary"
                href={`/admin/documents/${document.id}`}
              >
                编辑文档
              </Link>
              <Link
                className="button-link button-link--secondary"
                href={`/docs/${document.slug}`}
              >
                查看前台
              </Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
