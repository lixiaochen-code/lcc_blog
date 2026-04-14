import { randomUUID } from "node:crypto";

export type DocumentFormat = "md" | "mdx";
export type DocumentStatus = "draft" | "review" | "published" | "archived";
export type DocumentVisibility = "public" | "internal" | "private";
export type DocumentSourceType = "human" | "ai" | "import" | "sync";

export interface DocumentRecord {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  format: DocumentFormat;
  status: DocumentStatus;
  visibility: DocumentVisibility;
  sourceType: DocumentSourceType;
  createdBy: string;
  updatedBy: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentVersionRecord {
  id: string;
  documentId: string;
  versionNo: number;
  titleSnapshot: string;
  summarySnapshot: string;
  contentSnapshot: string;
  createdBy: string;
  createdAt: string;
}

export interface CreateDocumentInput {
  slug: string;
  title: string;
  summary: string;
  content: string;
  format?: DocumentFormat;
  visibility?: DocumentVisibility;
  sourceType?: DocumentSourceType;
  createdBy: string;
}

export interface UpdateDocumentInput {
  slug?: string;
  title?: string;
  summary?: string;
  content?: string;
  format?: DocumentFormat;
  visibility?: DocumentVisibility;
  status?: DocumentStatus;
  updatedBy: string;
}

export interface DocumentStore {
  documents: DocumentRecord[];
  versions: DocumentVersionRecord[];
}

const defaultStore: DocumentStore = {
  documents: [
    {
      id: "doc_seed_1",
      slug: "project-overview",
      title: "项目概览",
      summary: "介绍 AI 驱动知识平台的定位、边界和演进路线。",
      content:
        "这是首版文档内容样例，用于支撑 change-003 的 CRUD、发布和版本快照流程。",
      format: "mdx",
      status: "draft",
      visibility: "public",
      sourceType: "human",
      createdBy: "system",
      updatedBy: "system",
      publishedAt: null,
      createdAt: new Date("2026-04-15T00:00:00.000Z").toISOString(),
      updatedAt: new Date("2026-04-15T00:00:00.000Z").toISOString()
    }
  ],
  versions: []
};

function cloneStore(store: DocumentStore): DocumentStore {
  return {
    documents: store.documents.map((document) => ({ ...document })),
    versions: store.versions.map((version) => ({ ...version }))
  };
}

function nowIso() {
  return new Date().toISOString();
}

function createVersion(
  record: DocumentRecord,
  createdBy: string,
  versionNo: number
): DocumentVersionRecord {
  return {
    id: randomUUID(),
    documentId: record.id,
    versionNo,
    titleSnapshot: record.title,
    summarySnapshot: record.summary,
    contentSnapshot: record.content,
    createdBy,
    createdAt: nowIso()
  };
}

export class InMemoryDocumentsRepository {
  private readonly store: DocumentStore;

  constructor(store?: DocumentStore) {
    this.store = store ? cloneStore(store) : cloneStore(defaultStore);
  }

  listDocuments() {
    return [...this.store.documents].sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt)
    );
  }

  getDocumentById(id: string) {
    return this.store.documents.find((document) => document.id === id) ?? null;
  }

  getDocumentVersions(documentId: string) {
    return [
      ...this.store.versions.filter(
        (version) => version.documentId === documentId
      )
    ].sort((a, b) => b.versionNo - a.versionNo);
  }

  createDocument(input: CreateDocumentInput) {
    if (this.store.documents.some((document) => document.slug === input.slug)) {
      throw new Error("slug already exists");
    }

    const timestamp = nowIso();
    const record: DocumentRecord = {
      id: randomUUID(),
      slug: input.slug,
      title: input.title,
      summary: input.summary,
      content: input.content,
      format: input.format ?? "mdx",
      status: "draft",
      visibility: input.visibility ?? "public",
      sourceType: input.sourceType ?? "human",
      createdBy: input.createdBy,
      updatedBy: input.createdBy,
      publishedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    this.store.documents.push(record);
    return record;
  }

  updateDocument(id: string, input: UpdateDocumentInput) {
    const record = this.getDocumentById(id);

    if (!record) {
      throw new Error("document not found");
    }

    if (input.slug && input.slug !== record.slug) {
      const exists = this.store.documents.some(
        (document) => document.slug === input.slug && document.id !== id
      );
      if (exists) {
        throw new Error("slug already exists");
      }
    }

    Object.assign(record, {
      slug: input.slug ?? record.slug,
      title: input.title ?? record.title,
      summary: input.summary ?? record.summary,
      content: input.content ?? record.content,
      format: input.format ?? record.format,
      visibility: input.visibility ?? record.visibility,
      status: input.status ?? record.status,
      updatedBy: input.updatedBy,
      updatedAt: nowIso()
    });

    return record;
  }

  publishDocument(id: string, updatedBy: string) {
    const record = this.getDocumentById(id);

    if (!record) {
      throw new Error("document not found");
    }

    const nextVersion = this.getDocumentVersions(id)[0]?.versionNo ?? 0;
    this.store.versions.push(createVersion(record, updatedBy, nextVersion + 1));

    const publishedAt = nowIso();
    record.status = "published";
    record.updatedBy = updatedBy;
    record.updatedAt = publishedAt;
    record.publishedAt = publishedAt;

    return {
      document: record,
      version: this.getDocumentVersions(id)[0] ?? null
    };
  }

  deleteDocument(id: string, updatedBy: string) {
    const record = this.getDocumentById(id);

    if (!record) {
      throw new Error("document not found");
    }

    record.status = "archived";
    record.updatedBy = updatedBy;
    record.updatedAt = nowIso();

    return record;
  }
}

export const documentsRepository = new InMemoryDocumentsRepository();
