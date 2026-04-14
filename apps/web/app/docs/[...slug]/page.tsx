import { notFound } from "next/navigation";
import { getDocBySlug, docs } from "../../../lib/site-data";

interface DocPageProps {
  params: Promise<{ slug: string[] }>;
}

export function generateStaticParams() {
  return docs.map((doc) => ({ slug: doc.slug }));
}

export default async function DocDetailPage({ params }: DocPageProps) {
  const { slug } = await params;
  const foundDoc = getDocBySlug(slug);

  if (!foundDoc) {
    notFound();
  }

  const doc = foundDoc;

  return (
    <div className="docs-layout">
      <aside className="docs-sidebar">
        <h2>目录</h2>
        <ul>
          {docs.map((item) => {
            const href = `/docs/${item.slug.join("/")}`;
            const active = item.slug.join("/") === slug.join("/");

            return (
              <li key={href}>
                <a data-active={active} href={href}>
                  {item.title}
                </a>
              </li>
            );
          })}
        </ul>
      </aside>

      <article className="docs-content doc-detail">
        <div>
          <div className="doc-detail__meta">
            <span className="pill">{doc.section}</span>
            <span>{doc.readingTime}</span>
            <span>静态样例</span>
          </div>
          <h1>{doc.title}</h1>
          <p>{doc.summary}</p>
        </div>

        <div className="doc-detail__body">
          {doc.content.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </article>
    </div>
  );
}
