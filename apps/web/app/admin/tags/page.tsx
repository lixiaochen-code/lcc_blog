import Link from "next/link";
import type { TagRecord } from "@lcc-blog/db/tags";
import { listTags } from "../../../lib/tags-client";
import { requirePermission } from "../../../lib/auth";

export default async function AdminTagsPage() {
  await requirePermission("tag.read");
  const tags = listTags();

  return (
    <div className="search-layout">
      <section className="search-panel">
        <h1>后台标签管理</h1>
        <p>管理文档标签，支持创建、编辑和删除标签。</p>
        <Link
          className="button-link button-link--primary"
          href="/admin/tags/new"
        >
          新建标签
        </Link>
      </section>

      <section className="search-result-list">
        {tags.length === 0 ? (
          <p>暂无标签</p>
        ) : (
          tags.map((tag: TagRecord) => (
            <article className="search-result" key={tag.id}>
              <h2>{tag.name}</h2>
              <div className="search-result__meta">
                <span>slug: {tag.slug}</span>
              </div>
              <div className="hero-actions">
                <Link
                  className="button-link button-link--secondary"
                  href={`/admin/tags/${tag.id}`}
                >
                  编辑标签
                </Link>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
