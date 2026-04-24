import {
  documentsRepository,
  type DocumentRecord,
  type DocumentVisibility
} from "./documents.js";

export interface SearchFacetItem {
  slug: string;
  name: string;
}

export interface SearchResultItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  excerpt: string;
  score: number;
  status: string;
  visibility: DocumentVisibility;
  tags: SearchFacetItem[];
  categories: SearchFacetItem[];
}

export interface SearchDocumentsInput {
  query: string;
  page?: number;
  pageSize?: number;
  access: "guest" | "member" | "admin";
}

export interface SearchDocumentsResult {
  items: SearchResultItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const documentTaxonomy: Record<
  string,
  { categories: SearchFacetItem[]; tags: SearchFacetItem[] }
> = {
  doc_seed_1: {
    categories: [{ slug: "getting-started", name: "开始使用" }],
    tags: [{ slug: "overview", name: "概览" }]
  },
  doc_seed_2: {
    categories: [{ slug: "content", name: "内容治理" }],
    tags: [{ slug: "approval", name: "审批" }]
  },
  doc_seed_3: {
    categories: [{ slug: "admin-console", name: "后台管理" }],
    tags: [{ slug: "ops", name: "运维" }]
  },
  doc_seed_4: {
    categories: [{ slug: "search", name: "搜索" }],
    tags: [{ slug: "retrieval", name: "检索" }]
  }
};

function normalizeQuery(query: string) {
  return query.trim().toLowerCase();
}

function shouldIncludeDocument(
  document: DocumentRecord,
  access: SearchDocumentsInput["access"]
) {
  if (access === "admin") {
    return true;
  }

  if (document.status !== "published") {
    return false;
  }

  if (document.visibility === "public") {
    return true;
  }

  if (document.visibility === "internal") {
    return access === "member";
  }

  return false;
}

function countOccurrences(text: string, term: string) {
  if (!term) {
    return 0;
  }

  return text.split(term).length - 1;
}

function calculateScore(document: DocumentRecord, query: string) {
  const terms = query.split(/\s+/).filter(Boolean);

  if (terms.length === 0) {
    return 0;
  }

  const title = document.title.toLowerCase();
  const summary = document.summary.toLowerCase();
  const content = document.content.toLowerCase();

  return terms.reduce((score, term) => {
    return (
      score +
      countOccurrences(title, term) * 5 +
      countOccurrences(summary, term) * 3 +
      countOccurrences(content, term)
    );
  }, 0);
}

function buildExcerpt(document: DocumentRecord, query: string) {
  const source = `${document.summary} ${document.content}`.replace(/\s+/g, " ");
  const normalizedSource = source.toLowerCase();
  const terms = query.split(/\s+/).filter(Boolean);
  const index = terms
    .map((term) => normalizedSource.indexOf(term))
    .find((candidate) => candidate >= 0);

  if (index === undefined || index < 0) {
    return source.slice(0, 140);
  }

  const start = Math.max(0, index - 30);
  const end = Math.min(source.length, index + 110);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < source.length ? "..." : "";

  return `${prefix}${source.slice(start, end).trim()}${suffix}`;
}

function toSearchResultItem(document: DocumentRecord, score: number, query: string) {
  const taxonomy = documentTaxonomy[document.id] ?? {
    categories: [],
    tags: []
  };

  return {
    id: document.id,
    slug: document.slug,
    title: document.title,
    summary: document.summary,
    excerpt: buildExcerpt(document, query),
    score,
    status: document.status,
    visibility: document.visibility,
    categories: taxonomy.categories,
    tags: taxonomy.tags
  };
}

export function listAccessibleSearchDocuments(input: {
  access: SearchDocumentsInput["access"];
  limit?: number;
}): SearchResultItem[] {
  const limit = Math.min(50, Math.max(1, input.limit ?? 10));

  return documentsRepository
    .listDocuments()
    .filter((document) => shouldIncludeDocument(document, input.access))
    .slice(0, limit)
    .map((document) => toSearchResultItem(document, 0, ""));
}

export function searchDocuments(
  input: SearchDocumentsInput
): SearchDocumentsResult {
  const query = normalizeQuery(input.query);
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, input.pageSize ?? 10));

  if (!query) {
    return {
      items: [],
      page,
      pageSize,
      total: 0,
      totalPages: 0
    };
  }

  const matched = documentsRepository
    .listDocuments()
    .filter((document) => shouldIncludeDocument(document, input.access))
    .map((document) => ({
      document,
      score: calculateScore(document, query)
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return b.document.updatedAt.localeCompare(a.document.updatedAt);
    });

  const total = matched.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  const safePage = totalPages === 0 ? 1 : Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageItems = matched
    .slice(start, start + pageSize)
    .map(({ document, score }) => toSearchResultItem(document, score, query));

  return {
    items: pageItems,
    page: safePage,
    pageSize,
    total,
    totalPages
  };
}
