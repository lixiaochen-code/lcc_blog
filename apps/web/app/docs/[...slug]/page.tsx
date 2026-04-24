import { notFound } from "next/navigation";
import { DocsChrome } from "../../../components/docs-chrome";
import { getCurrentSession } from "../../../lib/auth";
import {
  getDocumentBySlug,
  listDocuments
} from "../../../lib/documents-client";
import { getDocBySlug, docs } from "../../../lib/site-data";

interface DocPageProps {
  params: Promise<{ slug: string[] }>;
}

export function generateStaticParams() {
  return [
    ...docs.map((doc) => ({ slug: doc.slug })),
    ...listDocuments().map((doc) => ({ slug: [doc.slug] }))
  ];
}

function canViewDocument(
  document: NonNullable<ReturnType<typeof getDocumentBySlug>>,
  session: Awaited<ReturnType<typeof getCurrentSession>>
) {
  if (
    session?.user?.roles.includes("admin") ||
    session?.user?.roles.includes("super_admin")
  ) {
    return true;
  }

  if (document.status !== "published") {
    return false;
  }

  if (document.visibility === "public") {
    return true;
  }

  return document.visibility === "internal" && Boolean(session?.user?.id);
}

export default async function DocDetailPage({ params }: DocPageProps) {
  const { slug } = await params;
  const foundDoc = getDocBySlug(slug);
  const currentSlug = slug.join("/");

  if (foundDoc) {
    const doc = foundDoc;

    return (
      <DocsChrome currentDoc={doc} currentSlug={currentSlug}>
        <article className="doc-article">
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
            {doc.content.map((paragraph, index) => (
              <section id={doc.outline[index]} key={paragraph}>
                <h2>{doc.outline[index]}</h2>
                <p>{paragraph}</p>
              </section>
            ))}
          </div>
        </article>
      </DocsChrome>
    );
  }

  const document = getDocumentBySlug(currentSlug);
  const session = await getCurrentSession();

  if (!document || !canViewDocument(document, session)) {
    notFound();
  }

  const doc = {
    title: document.title,
    slug: [document.slug],
    section: document.visibility === "private" ? "管理员文档" : "知识库文档",
    summary: document.summary,
    readingTime: "数据库文档",
    outline: ["摘要", "正文", "状态"],
    content: [
      document.summary,
      document.content,
      `状态：${document.status} · 可见性：${document.visibility}`
    ]
  };

  return (
    <DocsChrome currentDoc={doc} currentSlug={currentSlug}>
      <article className="doc-article">
        <div>
          <div className="doc-detail__meta">
            <span className="pill">{doc.section}</span>
            <span>{doc.readingTime}</span>
            <span>{document.sourceType}</span>
          </div>
          <h1>{doc.title}</h1>
          <p>{doc.summary}</p>
        </div>

        <div className="doc-detail__body">
          {doc.content.map((paragraph, index) => (
            <section id={doc.outline[index]} key={paragraph}>
              <h2>{doc.outline[index]}</h2>
              <p>{paragraph}</p>
            </section>
          ))}
        </div>
      </article>
    </DocsChrome>
  );
}
