import Link from "next/link";
import { navItems } from "../lib/site-data";

interface SiteHeaderProps {
  currentPath: string;
}

export function SiteHeader({ currentPath }: SiteHeaderProps) {
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
        </nav>
      </div>
    </header>
  );
}
