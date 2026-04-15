import assert from "node:assert/strict";
import test from "node:test";
import type { AdminNavItem } from "@lcc-blog/shared";
import { filterAdminNavItems } from "./admin-navigation";

test("admin navigation only includes items allowed by permissions", () => {
  const items = filterAdminNavItems(["doc.read", "tag.read"]);

  assert.deepEqual(
    items.map((item: AdminNavItem) => item.href),
    ["/admin/documents", "/admin/tags"]
  );
});
