import assert from "node:assert/strict";
import test from "node:test";
import { InMemoryCategoriesRepository } from "./categories.js";

test("categories repository creates category and prevents duplicate slug", () => {
  const repo = new InMemoryCategoriesRepository();
  const category = repo.createCategory({
    slug: "frontend",
    name: "前端开发",
    description: "前端相关文档"
  });

  assert.equal(category.slug, "frontend");
  assert.equal(category.name, "前端开发");
  assert.throws(
    () => repo.createCategory({ slug: "frontend", name: "前端2" }),
    /slug already exists/
  );
});

test("categories repository lists, finds, updates, and deletes categories", () => {
  const repo = new InMemoryCategoriesRepository();
  const backend = repo.createCategory({ slug: "backend", name: "后端" });
  repo.createCategory({ slug: "frontend", name: "前端" });

  const categories = repo.listCategories();
  assert.equal(categories.length, 2);
  assert.equal(categories[0]?.name, "前端");
  assert.equal(repo.getCategoryById(backend.id)?.slug, "backend");

  const updated = repo.updateCategory(backend.id, { name: "后端服务" });
  assert.equal(updated.name, "后端服务");

  const deleted = repo.deleteCategory(backend.id);
  assert.equal(deleted?.id, backend.id);
  assert.equal(repo.getCategoryById(backend.id), null);
});
