import assert from "node:assert/strict";
import test from "node:test";
import { listAccessibleSearchDocuments, searchDocuments } from "./search.js";

test("search DAL returns ranked matches with taxonomy metadata", () => {
  const result = searchDocuments({
    query: "搜索",
    access: "admin",
    page: 1,
    pageSize: 10
  });

  assert.equal(result.total > 0, true);
  assert.equal(
    result.items.some((item) => item.categories.length > 0),
    true
  );
  assert.equal(
    result.items.some((item) => item.tags.length > 0),
    true
  );
  assert.equal(
    (result.items[0]?.score ?? 0) >= (result.items.at(-1)?.score ?? 0),
    true
  );
});

test("search DAL enforces visibility filtering by access level", () => {
  const guest = searchDocuments({
    query: "治理",
    access: "guest"
  });
  const member = searchDocuments({
    query: "治理",
    access: "member"
  });
  const admin = searchDocuments({
    query: "运维",
    access: "admin"
  });

  assert.equal(guest.total, 0);
  assert.equal(
    member.items.every((item) => item.visibility !== "private"),
    true
  );
  assert.equal(
    admin.items.some((item) => item.visibility === "private"),
    true
  );
});

test("search DAL paginates results", () => {
  const firstPage = searchDocuments({
    query: "AI",
    access: "admin",
    page: 1,
    pageSize: 1
  });
  const secondPage = searchDocuments({
    query: "AI",
    access: "admin",
    page: 2,
    pageSize: 1
  });

  assert.equal(firstPage.items.length, 1);
  assert.equal(secondPage.items.length, 1);
  assert.notEqual(firstPage.items[0]?.id, secondPage.items[0]?.id);
});

test("search DAL can list accessible documents for overview fallback", () => {
  const memberItems = listAccessibleSearchDocuments({
    access: "member",
    limit: 10
  });

  assert.equal(memberItems.length > 0, true);
  assert.equal(
    memberItems.every((item) => item.visibility !== "private"),
    true
  );
});
