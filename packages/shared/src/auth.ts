export const roleCodes = ["guest", "user", "admin", "super_admin"] as const;

export type RoleCode = (typeof roleCodes)[number];

export const permissionCodes = [
  "doc.read",
  "doc.search",
  "doc.create",
  "doc.update",
  "doc.delete",
  "doc.publish",
  "doc.archive",
  "doc.rollback",
  "category.read",
  "category.manage",
  "tag.read",
  "tag.manage",
  "sidebar.read",
  "sidebar.update",
  "ai.search",
  "ai.ask",
  "ai.summarize",
  "ai.write",
  "ai.organize",
  "ai.delete",
  "ai.sync",
  "user.manage",
  "role.manage",
  "provider.manage",
  "mcp.manage",
  "audit.read",
  "system.manage"
] as const;

export type PermissionCode = (typeof permissionCodes)[number];

export interface AdminNavItem {
  href: string;
  label: string;
  permission: PermissionCode;
}

const userPermissions: PermissionCode[] = [
  "doc.read",
  "doc.search",
  "category.read",
  "tag.read",
  "sidebar.read",
  "ai.search",
  "ai.ask",
  "ai.summarize"
];

const adminPermissions: PermissionCode[] = [
  ...userPermissions,
  "doc.create",
  "doc.update",
  "doc.delete",
  "doc.publish",
  "doc.archive",
  "doc.rollback",
  "category.manage",
  "tag.manage",
  "sidebar.update",
  "ai.write",
  "ai.organize"
];

export const defaultRolePermissions: Record<
  Exclude<RoleCode, "guest">,
  PermissionCode[]
> = {
  user: userPermissions,
  admin: adminPermissions,
  super_admin: [...permissionCodes]
};

export const adminNavItems: AdminNavItem[] = [
  {
    href: "/admin/documents",
    label: "文档",
    permission: "doc.read"
  },
  {
    href: "/admin/categories",
    label: "分类",
    permission: "category.read"
  },
  {
    href: "/admin/tags",
    label: "标签",
    permission: "tag.read"
  },
  {
    href: "/admin/sidebar",
    label: "目录",
    permission: "sidebar.read"
  }
];
