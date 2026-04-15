import Link from "next/link";
import type { SidebarRecord } from "@lcc-blog/db/sidebars";
import { listSidebars } from "../../../lib/sidebars-client";
import { requirePermission } from "../../../lib/auth";

export default async function AdminSidebarsPage() {
  await requirePermission("sidebar.read");
  const sidebars = listSidebars();

  return (
    <div className="search-layout">
      <section className="search-panel">
        <h1>后台目录管理</h1>
        <p>管理文档目录树，支持创建、编辑和删除目录。</p>
        <Link
          className="button-link button-link--primary"
          href="/admin/sidebar/new"
        >
          新建目录
        </Link>
      </section>

      <section className="search-result-list">
        {sidebars.length === 0 ? (
          <p>暂无目录</p>
        ) : (
          sidebars.map((sidebar: SidebarRecord) => (
            <article className="search-result" key={sidebar.id}>
              <h2>{sidebar.name}</h2>
              <p>{sidebar.description || "无描述"}</p>
              <div className="search-result__meta">
                <span>slug: {sidebar.slug}</span>
              </div>
              <div className="hero-actions">
                <Link
                  className="button-link button-link--secondary"
                  href={`/admin/sidebar/${sidebar.id}`}
                >
                  管理目录项
                </Link>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
