import { aiLogsRepository } from "./ai-logs.js";
import { generateTextWithDefaultProvider } from "./providers.js";
import {
  listAccessibleSearchDocuments,
  searchDocuments,
  type SearchResultItem
} from "./search.js";

export type AiSearchMode = "search" | "ask" | "summarize";
export type AiSearchAccess = "guest" | "member" | "admin";

export interface AiSearchInput {
  query: string;
  mode: AiSearchMode;
  topK?: number;
  access: AiSearchAccess;
  userId: string;
}

export interface AiSearchCitation {
  documentId: string;
  slug: string;
  title: string;
  excerpt: string;
}

export interface AiSearchResponse {
  answer: string;
  citations: AiSearchCitation[];
  relatedDocuments: SearchResultItem[];
  taskId: string;
  provider: {
    name: string;
    model: string;
  };
}

function clampTopK(topK?: number) {
  return Math.min(5, Math.max(1, topK ?? 3));
}

function trimContextSnippet(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3).trimEnd()}...`;
}

function buildContextEntry(document: SearchResultItem, index: number) {
  return [
    `[${index}] ${document.title}`,
    `Summary: ${trimContextSnippet(document.summary, 160)}`,
    `Excerpt: ${trimContextSnippet(document.excerpt, 220)}`
  ].join("\n");
}

function buildPrompt(
  input: Pick<AiSearchInput, "query" | "mode">,
  documents: SearchResultItem[]
) {
  const context = documents
    .map((document, index) => buildContextEntry(document, index + 1))
    .join("\n\n");

  return [
    `Mode: ${input.mode}`,
    `Question: ${input.query.trim()}`,
    "Answer using only the supplied context and keep citations explicit.",
    `Context:\n${context}`
  ].join("\n\n");
}

function buildAnswer(
  generatedText: string,
  citations: AiSearchCitation[],
  mode: AiSearchMode
) {
  const citationLead = citations
    .map((citation, index) => `[${index + 1}] ${citation.title}`)
    .join("；");

  const modeSuffix =
    mode === "summarize"
      ? "已按摘要模式压缩上下文。"
      : mode === "search"
        ? "已按检索模式聚合结果。"
        : "已按问答模式组织回答。";

  return `${generatedText} ${modeSuffix} 参考来源：${citationLead}`.trim();
}

function isKnowledgeOverviewQuery(query: string) {
  const normalized = query.trim().toLowerCase();
  const overviewTerms = [
    "有哪些",
    "有什么",
    "哪些内容",
    "什么内容",
    "知识库",
    "文档",
    "目录",
    "全部",
    "列表",
    "overview",
    "what",
    "contents"
  ];

  return overviewTerms.some((term) => normalized.includes(term));
}

export async function runAiSearch(
  input: AiSearchInput
): Promise<AiSearchResponse> {
  const query = input.query.trim();

  if (!query) {
    throw new Error("query is required");
  }

  const result = searchDocuments({
    query,
    page: 1,
    pageSize: clampTopK(input.topK),
    access: input.access
  });
  const documents =
    result.items.length > 0
      ? result.items
      : isKnowledgeOverviewQuery(query)
        ? listAccessibleSearchDocuments({
            access: input.access,
            limit: clampTopK(input.topK)
          })
        : [];

  if (documents.length === 0) {
    throw new Error("no accessible documents matched the query");
  }

  const citations = documents.map((document) => ({
    documentId: document.id,
    slug: document.slug,
    title: document.title,
    excerpt: trimContextSnippet(document.excerpt, 180)
  }));

  const providerResult = await generateTextWithDefaultProvider({
    mode: input.mode,
    prompt: buildPrompt(input, documents)
  });

  const task = aiLogsRepository.createAiSearchLog({
    query,
    mode: input.mode,
    userId: input.userId,
    providerName: providerResult.providerName,
    model: providerResult.model,
    citationDocumentIds: citations.map((citation) => citation.documentId)
  });

  aiLogsRepository.createAuditLog({
    action: "ai.search.executed",
    actorId: input.userId,
    resourceType: "ai_search",
    resourceId: task.id,
    metadata: {
      mode: input.mode,
      providerName: providerResult.providerName,
      model: providerResult.model,
      citationDocumentIds: citations.map((citation) => citation.documentId)
    }
  });

  return {
    answer: buildAnswer(providerResult.text, citations, input.mode),
    citations,
    relatedDocuments: documents,
    taskId: task.id,
    provider: {
      name: providerResult.providerName,
      model: providerResult.model
    }
  };
}
