"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "../lib/site-data";

interface SiteNavProps {
  isSignedIn: boolean;
}

function isActivePath(currentPath: string, href: string) {
  if (href === "/") {
    return currentPath === "/";
  }

  return currentPath === href || currentPath.startsWith(`${href}/`);
}

export function SiteNav({ isSignedIn }: SiteNavProps) {
  const currentPath = usePathname();

  return (
    <nav className="site-nav" aria-label="主导航">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          data-active={isActivePath(currentPath, item.href)}
        >
          {item.label}
        </Link>
      ))}
      {isSignedIn ? (
        <Link href="/admin/documents" data-active={currentPath.startsWith("/admin")}>
          后台
        </Link>
      ) : (
        <Link href="/login" data-active={currentPath === "/login"}>
          登录
        </Link>
      )}
    </nav>
  );
}
