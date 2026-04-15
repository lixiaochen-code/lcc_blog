import Link from "next/link";
import type { AdminNavItem } from "@lcc-blog/shared";
import { filterAdminNavItems } from "../lib/admin-navigation";

interface AdminNavProps {
  currentPath: string;
  permissions: string[];
}

export function AdminNav({ currentPath, permissions }: AdminNavProps) {
  const items = filterAdminNavItems(permissions);

  if (items.length === 0) {
    return null;
  }

  return (
    <nav className="admin-nav" aria-label="后台导航">
      {items.map((item: AdminNavItem) => (
        <Link
          key={item.href}
          href={item.href}
          data-active={
            currentPath === item.href || currentPath.startsWith(`${item.href}/`)
          }
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
