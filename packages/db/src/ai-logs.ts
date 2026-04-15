export interface AiSearchLogRecord {
  id: string;
  query: string;
  mode: "search" | "ask" | "summarize";
  userId: string;
  providerName: string;
  model: string;
  citationDocumentIds: string[];
  createdAt: string;
}

export interface AuditLogRecord {
  id: string;
  action: string;
  actorId: string;
  resourceType: string;
  resourceId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

function nowIso() {
  return new Date().toISOString();
}

function nextId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export class InMemoryAiLogsRepository {
  private readonly aiSearchLogs: AiSearchLogRecord[] = [];

  private readonly auditLogs: AuditLogRecord[] = [];

  createAiSearchLog(
    input: Omit<AiSearchLogRecord, "id" | "createdAt">
  ): AiSearchLogRecord {
    const record: AiSearchLogRecord = {
      id: nextId("ai_search"),
      createdAt: nowIso(),
      ...input,
      citationDocumentIds: [...input.citationDocumentIds]
    };

    this.aiSearchLogs.push(record);
    return { ...record, citationDocumentIds: [...record.citationDocumentIds] };
  }

  createAuditLog(
    input: Omit<AuditLogRecord, "id" | "createdAt">
  ): AuditLogRecord {
    const record: AuditLogRecord = {
      id: nextId("audit"),
      createdAt: nowIso(),
      ...input,
      metadata: { ...input.metadata }
    };

    this.auditLogs.push(record);
    return { ...record, metadata: { ...record.metadata } };
  }

  listAiSearchLogs() {
    return this.aiSearchLogs.map((record) => ({
      ...record,
      citationDocumentIds: [...record.citationDocumentIds]
    }));
  }

  listAuditLogs() {
    return this.auditLogs.map((record) => ({
      ...record,
      metadata: { ...record.metadata }
    }));
  }

  reset() {
    this.aiSearchLogs.length = 0;
    this.auditLogs.length = 0;
  }
}

export const aiLogsRepository = new InMemoryAiLogsRepository();
