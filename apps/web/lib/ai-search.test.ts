import assert from "node:assert/strict";
import test from "node:test";
import type { Session } from "next-auth";
import { AuthorizationError } from "./auth";
import {
  assertAiSearchPermission,
  executeAiSearch,
  resolveAiSearchAccess,
  resolveAiSearchPermission
} from "./ai-search";

const userSession: Session = {
  user: {
    id: "user_editor_seed",
    email: "user@example.com",
    name: "User",
    roles: ["user"],
    permissions: ["ai.search", "ai.ask", "ai.summarize"],
    status: "active"
  },
  expires: "2099-01-01T00:00:00.000Z"
};

const adminSession: Session = {
  user: {
    id: "user_admin_seed",
    email: "admin@example.com",
    name: "Admin",
    roles: ["admin"],
    permissions: ["ai.search", "ai.ask", "ai.summarize"],
    status: "active"
  },
  expires: "2099-01-01T00:00:00.000Z"
};

const guestSession: Session = {
  user: {
    id: "guest-id",
    email: "guest@example.com",
    name: "Guest",
    roles: ["guest"],
    permissions: [],
    status: "active"
  },
  expires: "2099-01-01T00:00:00.000Z"
};

test("ai search helper resolves mode permissions and access scope", () => {
  assert.equal(resolveAiSearchPermission("search"), "ai.search");
  assert.equal(resolveAiSearchPermission("ask"), "ai.ask");
  assert.equal(resolveAiSearchPermission("summarize"), "ai.summarize");
  assert.equal(resolveAiSearchAccess(userSession), "member");
  assert.equal(resolveAiSearchAccess(adminSession), "admin");
});

test("ai search helper rejects guest or missing permission", () => {
  assert.throws(
    () => assertAiSearchPermission(null, "search"),
    (error: unknown) =>
      error instanceof AuthorizationError && error.status === 401
  );

  assert.throws(
    () => assertAiSearchPermission(guestSession, "search"),
    (error: unknown) =>
      error instanceof AuthorizationError &&
      error.status === 403 &&
      error.message === "missing permission: ai.search"
  );
});

test("ai search helper executes for allowed roles and returns citations", async () => {
  const memberResult = await executeAiSearch({
    session: userSession,
    query: "治理",
    mode: "ask",
    topK: 2
  });

  const adminResult = await executeAiSearch({
    session: adminSession,
    query: "运维",
    mode: "summarize",
    topK: 2
  });

  assert.equal(memberResult.citations.length > 0, true);
  assert.equal(
    memberResult.relatedDocuments.every(
      (item) => item.visibility !== "private"
    ),
    true
  );
  assert.equal(
    adminResult.relatedDocuments.some((item) => item.visibility === "private"),
    true
  );
});
