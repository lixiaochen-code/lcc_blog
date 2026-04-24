import Link from "next/link";
import type { ReactNode } from "react";
import { docSections, docs, type DocSummary } from "../lib/site-data";

interface DocsChromeProps {
  children: ReactNode;
  currentSlug?: string;
  currentDoc?: DocSummary;
}

function DocsNav({ currentSlug }: { currentSlug?: string }) {
  return (
    <nav className="docs-nav" aria-label="文档目录">
      <form className="docs-nav__search" action="/search" method="get">
        <input name="q" placeholder="搜索文档..." />
      </form>
      {docSections.map((section) => (
        <details className="docs-nav__group" key={section.title} open>
          <summary>{section.title}</summary>
          <ul>
            {section.items.map((doc) => {
              const slug = doc.slug.join("/");
              const active = currentSlug === slug;

              return (
                <li key={slug}>
                  <Link href={`/docs/${slug}`} data-active={active}>
                    {doc.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </details>
      ))}
    </nav>
  );
}

export function DocsChrome({
  children,
  currentSlug,
  currentDoc
}: DocsChromeProps) {
  const outline = currentDoc?.outline ?? [
    "文档优先",
    "对话更新",
    "网络检索",
    "人工确认"
  ];

  return (
    <div className="docs-shell">
      <input className="docs-drawer-toggle" id="docs-drawer" type="checkbox" />
      <label className="docs-drawer-backdrop" htmlFor="docs-drawer" />
      <aside className="docs-drawer">
        <div className="docs-drawer__header">
          <Link href="/docs">
            <strong>Knowledge Base</strong>
            <span>可迭代知识库</span>
          </Link>
          <label htmlFor="docs-drawer" aria-label="关闭目录">
            ×
          </label>
        </div>
        <DocsNav currentSlug={currentSlug} />
      </aside>

      <div className="docs-workspace">
        <div className="docs-mobile-bar">
          <label className="docs-menu-button" htmlFor="docs-drawer">
            目录
          </label>
          <Link href="/docs">文档首页</Link>
        </div>

        <aside className="docs-rail">
          <DocsNav currentSlug={currentSlug} />
        </aside>

        <main className="docs-main">{children}</main>

        <aside className="docs-outline" aria-label="当前页目录">
          <span>On this page</span>
          <ul>
            {outline.map((item) => (
              <li key={item}>
                <a href={`#${item}`}>{item}</a>
              </li>
            ))}
          </ul>
          <div className="docs-outline__note">
            文档变更默认先生成草稿，确认后再写入。
          </div>
        </aside>
      </div>
    </div>
  );
}

export function getFirstDoc() {
  return docs[0];
}
