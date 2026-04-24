import assert from "node:assert/strict";
import test from "node:test";
import { aiLogsRepository } from "./ai-logs.js";
import { runAiSearch } from "./ai-search.js";

test("ai search returns answer, citations, related documents, and logs", async () => {
  aiLogsRepository.reset();

  const result = await runAiSearch({
    query: "搜索",
    mode: "search",
    topK: 2,
    access: "admin",
    userId: "user_admin_seed"
  });

  assert.equal(result.citations.length, 2);
  assert.equal(result.relatedDocuments.length, 2);
  assert.equal(result.answer.includes("参考来源："), true);
  assert.equal(result.provider.name, "default-ai");
  assert.equal(result.provider.model, "gpt-5.4");

  const aiLogs = aiLogsRepository.listAiSearchLogs();
  const auditLogs = aiLogsRepository.listAuditLogs();

  assert.equal(aiLogs.length, 1);
  assert.equal(aiLogs[0]?.citationDocumentIds.length, 2);
  assert.equal(auditLogs.length, 1);
  assert.deepEqual(auditLogs[0]?.metadata.citationDocumentIds, [
    result.citations[0]?.documentId,
    result.citations[1]?.documentId
  ]);
});

test("ai search respects document visibility for members", async () => {
  aiLogsRepository.reset();

  const result = await runAiSearch({
    query: "治理",
    mode: "ask",
    topK: 3,
    access: "member",
    userId: "user_editor_seed"
  });

  assert.equal(
    result.relatedDocuments.every((item) => item.visibility !== "private"),
    true
  );
  assert.equal(
    result.citations.every((item) => item.documentId !== "doc_seed_3"),
    true
  );
});

test("ai search rejects empty or inaccessible queries", async () => {
  await assert.rejects(
    runAiSearch({
      query: "   ",
      mode: "search",
      topK: 3,
      access: "member",
      userId: "user_editor_seed"
    }),
    /query is required/
  );

  await assert.rejects(
    runAiSearch({
      query: "运维",
      mode: "summarize",
      topK: 3,
      access: "guest",
      userId: "guest"
    }),
    /no accessible documents matched the query/
  );
});

test("ai search falls back to accessible document overview for collection questions", async () => {
  aiLogsRepository.reset();

  const result = await runAiSearch({
    query: "知识库有哪些内容？",
    mode: "search",
    topK: 3,
    access: "member",
    userId: "user_editor_seed"
  });

  assert.equal(result.citations.length, 3);
  assert.equal(
    result.relatedDocuments.every((item) => item.visibility !== "private"),
    true
  );
  assert.equal(result.answer.includes("参考来源："), true);
});
