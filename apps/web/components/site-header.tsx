import Link from "next/link";
import { navItems } from "../lib/site-data";
import { getCurrentSession } from "../lib/auth";

interface SiteHeaderProps {
  currentPath: string;
}

export async function SiteHeader({ currentPath }: SiteHeaderProps) {
  const session = await getCurrentSession();

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="site-brand" href="/">
          <strong>AI 驱动知识平台</strong>
          <span>文档站、知识库与 AI 协作壳体</span>
        </Link>
        <nav className="site-nav" aria-label="主导航">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              data-active={
                currentPath === item.href ||
                currentPath.startsWith(`${item.href}/`) ||
                (item.href === "/docs" && currentPath === "/docs")
              }
            >
              {item.label}
            </Link>
          ))}
          {session?.user?.id ? (
            <Link
              href="/admin/documents"
              data-active={currentPath.startsWith("/admin")}
            >
              后台
            </Link>
          ) : (
            <Link href="/login" data-active={currentPath === "/login"}>
              登录
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
