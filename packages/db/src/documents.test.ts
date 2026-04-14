import test from "node:test";
import assert from "node:assert/strict";
import { InMemoryDocumentsRepository } from "./documents.js";

test("documents repository supports create and list", () => {
  const repository = new InMemoryDocumentsRepository();
  const created = repository.createDocument({
    slug: "new-doc",
    title: "新文档",
    summary: "摘要",
    content: "正文",
    createdBy: "tester"
  });

  assert.equal(created.status, "draft");
  assert.equal(
    repository
      .listDocuments()
      .some((document: { slug: string }) => document.slug === "new-doc"),
    true
  );
});

test("publishing creates a version snapshot", () => {
  const repository = new InMemoryDocumentsRepository();
  const created = repository.createDocument({
    slug: "publish-doc",
    title: "待发布文档",
    summary: "摘要",
    content: "正文",
    createdBy: "tester"
  });

  const result = repository.publishDocument(created.id, "publisher");

  assert.equal(result.document.status, "published");
  assert.ok(result.version);
  assert.equal(result.version?.versionNo, 1);
});

test("deleting archives the document", () => {
  const repository = new InMemoryDocumentsRepository();
  const created = repository.createDocument({
    slug: "archive-doc",
    title: "待归档文档",
    summary: "摘要",
    content: "正文",
    createdBy: "tester"
  });

  const deleted = repository.deleteDocument(created.id, "tester");

  assert.equal(deleted.status, "archived");
});
