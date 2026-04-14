import Link from "next/link";
import { notFound } from "next/navigation";
import type { DocumentVersionRecord } from "@lcc-blog/db/documents";
import {
  getDocumentById,
  getDocumentVersions
} from "../../../../lib/documents-client";

interface AdminDocumentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminDocumentDetailPage({
  params
}: AdminDocumentDetailPageProps) {
  const { id } = await params;
  const document = getDocumentById(id);

  if (!document) {
    notFound();
  }

  const versions = getDocumentVersions(id);

  return (
    <div className="docs-layout">
      <aside className="docs-sidebar">
        <h2>操作</h2>
        <ul>
          <li>
            <a data-active="true" href={`#document-${document.id}`}>
              当前文档
            </a>
          </li>
          <li>
            <Link href="/admin/documents">返回列表</Link>
          </li>
        </ul>
      </aside>

      <section
        className="docs-content doc-detail"
        id={`document-${document.id}`}
      >
        <div>
          <div className="doc-detail__meta">
            <span className="pill">{document.status}</span>
            <span>{document.visibility}</span>
            <span>{document.format}</span>
          </div>
          <h1>{document.title}</h1>
          <p>{document.summary}</p>
        </div>

        <div className="doc-detail__body">
          <p>{document.content}</p>
        </div>

        <section className="search-result">
          <h2>发布动作</h2>
          <p>
            发布接口已就绪：`POST /api/documents/{id}
            /publish`。当前页面先展示接口入口，不接表单提交。
          </p>
        </section>

        <section className="search-result">
          <h2>版本快照</h2>
          {versions.length === 0 ? (
            <p>当前还没有版本快照。首次发布后会生成 version 1。</p>
          ) : (
            <ul>
              {versions.map((version: DocumentVersionRecord) => (
                <li key={version.id}>
                  v{version.versionNo} · {version.createdAt}
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </div>
  );
}
