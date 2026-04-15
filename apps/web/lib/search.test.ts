import assert from "node:assert/strict";
import test from "node:test";
import type { Session } from "next-auth";
import { executeSearch, resolveSearchAccess } from "./search";

const memberSession: Session = {
  user: {
    id: "1",
    email: "user@example.com",
    name: "User",
    roles: ["user"],
    permissions: [],
    status: "active"
  },
  expires: "2099-01-01T00:00:00.000Z"
};

const adminSession: Session = {
  user: {
    id: "2",
    email: "admin@example.com",
    name: "Admin",
    roles: ["admin"],
    permissions: [],
    status: "active"
  },
  expires: "2099-01-01T00:00:00.000Z"
};

test("search helper maps session roles to access scope", () => {
  assert.equal(resolveSearchAccess(null), "guest");
  assert.equal(resolveSearchAccess(memberSession), "member");
  assert.equal(resolveSearchAccess(adminSession), "admin");
});

test("search helper returns filtered paginated results", () => {
  const result = executeSearch({
    query: "搜索",
    page: 1,
    pageSize: 1,
    session: null
  });

  assert.equal(result.items.length <= 1, true);
  assert.equal(
    result.items.every(
      (item: { visibility: string }) => item.visibility === "public"
    ),
    true
  );
});
