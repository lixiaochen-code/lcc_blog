import Link from "next/link";
import type { CategoryRecord } from "@lcc-blog/db/categories";
import { listCategories } from "../../../lib/categories-client";
import { requirePermission } from "../../../lib/auth";

export default async function AdminCategoriesPage() {
  await requirePermission("category.read");
  const categories = listCategories();

  return (
    <div className="search-layout">
      <section className="search-panel">
        <h1>后台分类管理</h1>
        <p>管理文档分类，支持创建、编辑和删除分类。</p>
        <Link
          className="button-link button-link--primary"
          href="/admin/categories/new"
        >
          新建分类
        </Link>
      </section>

      <section className="search-result-list">
        {categories.length === 0 ? (
          <p>暂无分类</p>
        ) : (
          categories.map((category: CategoryRecord) => (
            <article className="search-result" key={category.id}>
              <h2>{category.name}</h2>
              <p>{category.description || "无描述"}</p>
              <div className="search-result__meta">
                <span>slug: {category.slug}</span>
              </div>
              <div className="hero-actions">
                <Link
                  className="button-link button-link--secondary"
                  href={`/admin/categories/${category.id}`}
                >
                  编辑分类
                </Link>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
