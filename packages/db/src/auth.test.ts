import assert from "node:assert/strict";
import test from "node:test";
import {
  InMemoryAuthRepository,
  createRBACSeedSnapshot,
  hashPassword
} from "./auth.js";

test("rbac seed snapshot includes core roles and permissions", () => {
  const snapshot = createRBACSeedSnapshot();

  assert.equal(
    snapshot.roles.some((role) => role.code === "admin"),
    true
  );
  assert.equal(
    snapshot.permissions.some((permission) => permission.code === "doc.read"),
    true
  );
  assert.equal(snapshot.rolePermissions.length > 0, true);
});

test("auth repository verifies credentials and aggregates permissions", () => {
  const repository = new InMemoryAuthRepository();
  const user = repository.verifyUserCredentials(
    "admin@example.com",
    "admin123"
  );

  assert.ok(user);
  assert.equal(user?.roles.includes("admin"), true);
  assert.equal(user?.permissions.includes("doc.publish"), true);
  assert.equal(user?.permissions.includes("provider.manage"), false);
});

test("auth repository can create user with default user role", () => {
  const repository = new InMemoryAuthRepository();
  const created = repository.createUser({
    email: "reader@example.com",
    password: "secret123"
  });

  assert.equal(created.passwordHash, hashPassword("secret123"));

  const user = repository.getAuthenticatedUser(created.id);
  assert.ok(user);
  assert.deepEqual(user?.roles, ["user"]);
  assert.equal(user?.permissions.includes("ai.search"), true);
  assert.equal(user?.permissions.includes("doc.create"), false);
});
