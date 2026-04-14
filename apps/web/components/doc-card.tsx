import Link from "next/link";
import type { DocSummary } from "../lib/site-data";

interface DocCardProps {
  doc: DocSummary;
}

export function DocCard({ doc }: DocCardProps) {
  return (
    <article className="doc-card">
      <div className="doc-card__meta">
        <span className="pill">{doc.section}</span>
        <span>{doc.readingTime}</span>
      </div>
      <h3>{doc.title}</h3>
      <p>{doc.summary}</p>
      <Link
        className="button-link button-link--secondary"
        href={`/docs/${doc.slug.join("/")}`}
      >
        阅读文档
      </Link>
    </article>
  );
}
