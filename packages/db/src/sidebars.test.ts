import assert from "node:assert/strict";
import test from "node:test";
import { InMemorySidebarsRepository } from "./sidebars.js";

test("sidebars repository creates nested items and sorts by order", () => {
  const repo = new InMemorySidebarsRepository();
  const sidebar = repo.createSidebar({ slug: "docs", name: "文档" });
  const parent = repo.createSidebarItem({
    sidebarId: sidebar.id,
    type: "category",
    label: "指南"
  });

  repo.createSidebarItem({
    sidebarId: sidebar.id,
    parentId: parent.id,
    type: "document",
    label: "第二项",
    order: 2
  });
  repo.createSidebarItem({
    sidebarId: sidebar.id,
    type: "document",
    label: "第一项",
    order: 1
  });

  const items = repo.listSidebarItems(sidebar.id);
  assert.equal(items.length, 3);
  assert.equal(items[0]?.label, "指南");
  assert.equal(items[1]?.label, "第一项");
  assert.equal(items[2]?.label, "第二项");
});

test("sidebars repository validates relationships and cascades deletes", () => {
  const repo = new InMemorySidebarsRepository();
  const sidebar = repo.createSidebar({ slug: "docs", name: "文档" });
  const parent = repo.createSidebarItem({
    sidebarId: sidebar.id,
    type: "category",
    label: "父项"
  });

  assert.throws(
    () =>
      repo.createSidebarItem({
        sidebarId: sidebar.id,
        parentId: "missing",
        type: "document",
        label: "坏父节点"
      }),
    /parent item not found/
  );

  repo.createSidebarItem({
    sidebarId: sidebar.id,
    parentId: parent.id,
    type: "document",
    label: "子项"
  });

  repo.deleteSidebarItem(parent.id);
  assert.equal(repo.listSidebarItems(sidebar.id).length, 0);
});
