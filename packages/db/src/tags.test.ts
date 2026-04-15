import assert from "node:assert/strict";
import test from "node:test";
import { InMemoryTagsRepository } from "./tags.js";

test("tags repository creates tag and prevents duplicate slug", () => {
  const repo = new InMemoryTagsRepository();
  const tag = repo.createTag({
    slug: "typescript",
    name: "TypeScript"
  });

  assert.equal(tag.slug, "typescript");
  assert.throws(
    () => repo.createTag({ slug: "typescript", name: "TS" }),
    /slug already exists/
  );
});

test("tags repository lists, updates, and deletes tags", () => {
  const repo = new InMemoryTagsRepository();
  const react = repo.createTag({ slug: "react", name: "React" });
  repo.createTag({ slug: "vue", name: "Vue" });

  const tags = repo.listTags();
  assert.equal(tags.length, 2);
  assert.equal(tags[0]?.name, "React");

  const updated = repo.updateTag(react.id, { name: "React 生态" });
  assert.equal(updated.name, "React 生态");

  const deleted = repo.deleteTag(react.id);
  assert.equal(deleted?.id, react.id);
  assert.equal(repo.getTagById(react.id), null);
});
