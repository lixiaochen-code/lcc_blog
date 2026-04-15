import {
  adminNavItems,
  type AdminNavItem,
  type PermissionCode
} from "@lcc-blog/shared";

export function filterAdminNavItems(userPermissions: string[]) {
  const allowed = new Set(userPermissions as PermissionCode[]);

  return adminNavItems.filter((item: AdminNavItem) =>
    allowed.has(item.permission)
  );
}
