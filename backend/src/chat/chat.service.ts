import { BadRequestException, Injectable } from "@nestjs/common";
import { fetch as undiciFetch, ProxyAgent } from "undici";
import { RuntimeService } from "../runtime/runtime.service";
import { getProxyUrl } from "../common/proxy";

const MODEL_TIMEOUT_MS = Number(process.env.AI_MODEL_TIMEOUT_MS || 30000);

type ChatMessage = {
  role: string;
  content: string;
};

type StreamedChatChunk = {
  model: string;
  delta: string;
};

const actionPermissions: Record<string, string> = {
  retrieve: "notes.read",
  add: "notes.create",
  append: "notes.update",
  "append-from-url": "kb.ingest_url",
  "organize-entry": "docs.reorganize",
  "update-meta": "notes.update",
  delete: "notes.delete",
  "inspect-url": "notes.read",
  "ingest-url": "kb.ingest_url",
  build: "site.build",
};

const supportedKbActions = Object.keys(actionPermissions);
const proxyUrl = getProxyUrl();
const proxyAgent = proxyUrl ? new ProxyAgent(proxyUrl) : null;

@Injectable()
export class ChatService {
  constructor(private readonly runtimeService: RuntimeService) {}

  private extractQuotedTitle(message: string) {
    const text = String(message || "").trim();
    const quoted =
      text.match(/《([^》]+)》/)?.[1] ||
      text.match(/“([^”]+)”/)?.[1] ||
      text.match(/"([^"]+)"/)?.[1] ||
      "";
    return String(quoted || "").trim();
  }

  private extractSingleLineField(message: string, labels: string[]) {
    for (const label of labels) {
      const pattern = new RegExp(
        `(?:^|[\\n，,；;。])\\s*(?:${label})\\s*[:：]\\s*([^\\n，,；;。]+)`,
        "im",
      );
      const matched = String(message || "").match(pattern)?.[1];
      if (matched) {
        return matched.trim();
      }
    }
    return "";
  }

  private extractBlockField(message: string, labels: string[]) {
    const escapedLabels = labels.map((label) =>
      label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    );
    const joinedLabels = escapedLabels.join("|");
    const pattern = new RegExp(
      `(?:^|[\\n，,；;。])\\s*(?:${joinedLabels})\\s*[:：]\\s*([\\s\\S]*?)(?=(?:[\\n，,；;。])\\s*(?:标题|title|分类|category|标签|tags|摘要|summary|内容|正文|补充|追加内容|append|笔记|note|slug|文件|目标笔记|target)\\s*[:：]|$)`,
      "i",
    );
    const matched = String(message || "").match(pattern)?.[1];
    return matched ? matched.trim() : "";
  }

  private extractNoteReference(message: string) {
    const directRef = this.extractSingleLineField(message, [
      "笔记",
      "note",
      "slug",
      "文件",
      "目标笔记",
      "target",
    ]);
    if (directRef) {
      return directRef;
    }
    return this.extractQuotedTitle(message);
  }

  private extractMeaningfulLines(message: string) {
    return String(message || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  private extractOrganizeTarget(message: string) {
    const directRef = this.extractNoteReference(message);
    if (directRef) {
      return directRef;
    }

    const lines = this.extractMeaningfulLines(message);
    const ignored = new Set([
      "整理以下目录",
      "整理目录",
      "待整理",
      "归档",
      "归类",
    ]);
    const candidate = [...lines].reverse().find((line) => !ignored.has(line));
    return String(candidate || "").trim();
  }

  private extractOrganizeDestination(message: string) {
    const explicit =
      this.extractSingleLineField(message, [
        "目录",
        "栏目",
        "分组",
        "section",
        "目标目录",
        "目标栏目",
      ]) || "";
    if (explicit) {
      return explicit;
    }

    const text = String(message || "").trim();
    const matched =
      text.match(
        /(?:归到|归入|移到|移动到|放到)\s*[《“"]?([^》”"\n]+)[》”"]?/,
      )?.[1] || "";
    return String(matched || "").trim();
  }

  private buildOrganizeArgs(message: string) {
    const target = this.extractOrganizeTarget(message);
    const section = this.extractOrganizeDestination(message);
    return {
      target,
      ...(section ? { section } : {}),
    };
  }

  private buildAddArgs(message: string) {
    const title =
      this.extractSingleLineField(message, ["标题", "title"]) ||
      this.extractQuotedTitle(message);
    const content = this.extractBlockField(message, ["内容", "正文"]);
    const category = this.extractSingleLineField(message, ["分类", "category"]);
    const tags = this.extractSingleLineField(message, ["标签", "tags"]);
    const summary = this.extractSingleLineField(message, ["摘要", "summary"]);
    return {
      title,
      content,
      ...(category ? { category } : {}),
      ...(tags ? { tags } : {}),
      ...(summary ? { summary } : {}),
    };
  }

  private buildAppendArgs(message: string) {
    const noteRef = this.extractNoteReference(message);
    const append = this.extractBlockField(message, [
      "补充",
      "追加内容",
      "append",
      "内容",
      "正文",
    ]);
    const section = this.extractSingleLineField(message, [
      "章节",
      "小节",
      "section",
    ]);
    return {
      noteRef,
      append,
      ...(section ? { section } : {}),
    };
  }

  private buildUrlActionArgs(message: string, matchedUrl: string) {
    const title = this.extractSingleLineField(message, ["标题", "title"]);
    const category = this.extractSingleLineField(message, ["分类", "category"]);
    const tags = this.extractSingleLineField(message, ["标签", "tags"]);
    const summary = this.extractSingleLineField(message, ["摘要", "summary"]);
    return {
      url: matchedUrl,
      ...(title ? { title } : {}),
      ...(category ? { category } : {}),
      ...(tags ? { tags } : {}),
      ...(summary ? { summary } : {}),
    };
  }

  private buildAppendFromUrlArgs(message: string, matchedUrl: string) {
    const noteRef = this.extractNoteReference(message);
    const section = this.extractSingleLineField(message, [
      "章节",
      "小节",
      "section",
    ]);
    const contentMode = /全文|原文|完整内容|full/i.test(message)
      ? "full"
      : "summary";
    return {
      url: matchedUrl,
      target: noteRef,
      ...(section ? { section } : {}),
      ...(contentMode ? { contentMode } : {}),
    };
  }

  detectDirectAction(message: string) {
    const rawText = String(message || "").trim();
    const text = rawText.toLowerCase();
    if (!text) return null;
    const matchedUrl = text.match(/https?:\/\/\S+/i)?.[0] || "";
    const isGithubRepoUrl =
      /^https?:\/\/github\.com\/[^/\s]+\/[^/\s?#]+\/?$/i.test(matchedUrl);
    const wantsProjectSummary =
      /这个项目|这个仓库|这个repo|这(是)?(个|一个)?什么(项目|仓库|repo)|项目主要|项目是干什么|仓库是干什么|repo是干什么|what.*(project|repo|repository)|about.*(project|repo|repository)|what does.*(repo|repository)/.test(
        text,
      );
    const wantsIngest = /导入|收录|保存到知识库|ingest/.test(text);
    if (
      matchedUrl &&
      !wantsIngest &&
      (wantsProjectSummary || isGithubRepoUrl)
    ) {
      return {
        intent: "inspect external url and summarize project purpose",
        action: "inspect-url",
        args: { url: matchedUrl },
        title: "解析链接内容",
        reply: "收到，我先解析这个链接并给你总结项目用途。",
      };
    }

    if (wantsAdd) {
      const args = this.buildAddArgs(rawText);
      if (String(args.title || "").trim()) {
        return {
          intent: "create a new note in the knowledge base",
          action: "add",
          args,
          title: "新增知识库笔记",
          reply: "收到，我按你给的信息新建一篇笔记。",
        };
      }
    }

    if (wantsOrganizeEntry) {
      const args = this.buildOrganizeArgs(rawText);
      if (String(args.target || "").trim()) {
        return {
          intent: "organize a note entry into the appropriate docs section",
          action: "organize-entry",
          args,
          title: "整理目录归档",
          reply: "收到，我把这篇内容整理到合适的目录里。",
        };
      }
    }

    if (wantsOverview) {
      return {
        intent: "show a high-level overview of the current knowledge base",
        action: "retrieve",
        args: { query: rawText, overview: true },
        title: "查看知识库内容",
        reply: "收到，我先整理当前知识库的内容概览。",
      };
    }

    if (wantsAppend) {
      const args = this.buildAppendArgs(rawText);
      if (
        String(args.noteRef || "").trim() &&
        String(args.append || "").trim()
      ) {
        return {
          intent: "append new content to an existing note",
          action: "append",
          args: {
            target: args.noteRef,
            append: args.append,
            ...(args.section ? { section: args.section } : {}),
          },
          title: "补充知识库内容",
          reply: "收到，我把这段内容补充到指定笔记。",
        };
      }
    }

    const rebuildPatterns = [
      /整理.*知识库/,
      /重建.*知识库/,
      /刷新.*知识库/,
      /重建.*索引/,
      /刷新.*索引/,
      /重组.*目录/,
      /\bkb\s*build\b/,
      /\bbuild\s*(kb|knowledge)\b/,
    ];
    if (rebuildPatterns.some((pattern) => pattern.test(text))) {
      return {
        intent: "rebuild knowledge base index and navigation",
        action: "build",
        args: {},
        title: "整理知识库",
        reply: "收到，开始整理知识库并重建索引。",
      };
    }
    return null;
  }

  getActionPermission(action: string) {
    return actionPermissions[action];
  }

  normalizePlannedArgs(
    action: string,
    args: Record<string, unknown>,
    message: string,
  ) {
    const nextArgs = typeof args === "object" && args ? { ...args } : {};
    const fallbackMessage = String(message || "").trim();
    if (action === "retrieve" && !String(nextArgs.query || "").trim()) {
      nextArgs.query = fallbackMessage;
    }
    if (
      (action === "append" || action === "append-from-url") &&
      !String(nextArgs.target || "").trim()
    ) {
      const noteRef = this.extractNoteReference(fallbackMessage);
      if (noteRef) {
        nextArgs.target = noteRef;
      }
    }
    if (action === "organize-entry") {
      const inferredArgs = this.buildOrganizeArgs(fallbackMessage);
      if (!String(nextArgs.target || "").trim() && inferredArgs.target) {
        nextArgs.target = inferredArgs.target;
      }
      if (!String(nextArgs.section || "").trim() && inferredArgs.section) {
        nextArgs.section = inferredArgs.section;
      }
    }
    if (action === "add") {
      const inferredArgs = this.buildAddArgs(fallbackMessage);
      if (!String(nextArgs.title || "").trim() && inferredArgs.title) {
        nextArgs.title = inferredArgs.title;
      }
      if (!String(nextArgs.content || "").trim() && inferredArgs.content) {
        nextArgs.content = inferredArgs.content;
      }
      if (!String(nextArgs.category || "").trim() && inferredArgs.category) {
        nextArgs.category = inferredArgs.category;
      }
      if (!String(nextArgs.tags || "").trim() && inferredArgs.tags) {
        nextArgs.tags = inferredArgs.tags;
      }
      if (!String(nextArgs.summary || "").trim() && inferredArgs.summary) {
        nextArgs.summary = inferredArgs.summary;
      }
    }
    if (action === "append") {
      const inferredArgs = this.buildAppendArgs(fallbackMessage);
      if (!String(nextArgs.target || "").trim() && inferredArgs.noteRef) {
        nextArgs.target = inferredArgs.noteRef;
      }
      if (!String(nextArgs.append || "").trim() && inferredArgs.append) {
        nextArgs.append = inferredArgs.append;
      }
      if (!String(nextArgs.section || "").trim() && inferredArgs.section) {
        nextArgs.section = inferredArgs.section;
      }
    }
    if (
      (action === "inspect-url" || action === "ingest-url") &&
      !String(nextArgs.url || "").trim()
    ) {
      const matchedUrl = fallbackMessage.match(/https?:\/\/\S+/i);
      if (matchedUrl) {
        nextArgs.url = matchedUrl[0];
      }
    }
    if (action === "append-from-url") {
      const matchedUrl = fallbackMessage.match(/https?:\/\/\S+/i);
      if (!String(nextArgs.url || "").trim() && matchedUrl) {
        nextArgs.url = matchedUrl[0];
      }
      if (!String(nextArgs.target || "").trim()) {
        const noteRef = this.extractNoteReference(fallbackMessage);
        if (noteRef) {
          nextArgs.target = noteRef;
        }
      }
    }
    return nextArgs;
  }

  normalizeHistory(history: Array<{ role?: string; content?: string }>) {
    if (!Array.isArray(history)) return [];
    return history
      .filter(
        (entry) => entry && ["user", "assistant"].includes(String(entry.role)),
      )
      .slice(-8)
      .map((entry) => ({
        role: String(entry.role),
        content: String(entry.content || "").trim(),
      }))
      .filter((entry) => entry.content);
  }

  extractJsonFromText(text: string) {
    const raw = String(text || "").trim();
    if (!raw) throw new BadRequestException("Model returned empty content.");
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = fenced ? fenced[1].trim() : raw;
    try {
      return JSON.parse(candidate);
    } catch {
      const start = candidate.indexOf("{");
      const end = candidate.lastIndexOf("}");
      if (start !== -1 && end !== -1 && end > start) {
        return JSON.parse(candidate.slice(start, end + 1));
      }
      throw new BadRequestException("Failed to parse model JSON output.");
    }
  }

  extractTextContent(content: unknown) {
    if (typeof content === "string") {
      return content;
    }
    if (!Array.isArray(content)) {
      return "";
    }
    return content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }
        if (
          part &&
          typeof part === "object" &&
          typeof (part as { text?: unknown }).text === "string"
        ) {
          return String((part as { text?: unknown }).text);
        }
        return "";
      })
      .join("");
  }

  async requestChatCompletion(
    messages: ChatMessage[],
    options: { stream?: boolean } = {},
  ) {
    const runtime = await this.runtimeService.getConfig();
    const protocol =
      String(runtime?.server?.protocol || "https").trim() || "https";
    const baseUrl = String(runtime?.server?.baseUrl || "")
      .trim()
      .replace(/\/+$/, "");
    const model = String(runtime?.model?.selected || "").trim();
    const apiKey = String(runtime?.credentials?.apiKey || "").trim();
    if (!baseUrl || !model || !apiKey) {
      throw new BadRequestException(
        "AI runtime is not ready. Please configure baseUrl, model, and apiKey first.",
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS);
    let response: Response;
    try {
      const requestInit: any = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: options.stream ? "text/event-stream" : "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          messages,
          ...(options.stream ? { stream: true } : {}),
        }),
        signal: controller.signal,
        ...(proxyAgent ? { dispatcher: proxyAgent } : {}),
      };
      response = await undiciFetch(
        `${protocol}://${baseUrl}/chat/completions`,
        requestInit,
      );
    } catch (error: any) {
      if (error?.name === "AbortError") {
        throw new BadRequestException(
          `Upstream model timeout after ${MODEL_TIMEOUT_MS}ms.`,
        );
      }
      const detail = [error?.message, error?.cause?.message, error?.cause?.code]
        .filter(Boolean)
        .join(" | ");
      console.error("[chat] upstream fetch failed", error);
      throw new BadRequestException(detail || "Upstream model request failed.");
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const raw = await response.text().catch(() => "");
      let message = "Upstream model request failed.";
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          message = parsed?.error?.message || parsed?.message || raw;
        } catch {
          message = raw;
        }
      }
      throw new BadRequestException(message);
    }
    return { model, response };
  }

  async callChatModel(messages: ChatMessage[]) {
    const { model, response } = await this.requestChatCompletion(messages);
    const data: any = await response.json().catch(() => ({}));
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new BadRequestException("Upstream model returned no content.");
    }
    return { model, content: this.extractTextContent(content) };
  }

  async *streamChatModel(
    messages: ChatMessage[],
  ): AsyncGenerator<StreamedChatChunk> {
    const { model, response } = await this.requestChatCompletion(messages, {
      stream: true,
    });
    if (!response.body) {
      throw new BadRequestException("Upstream model did not return a stream.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    const consumeEvent = (rawEvent: string) => {
      const dataLines = rawEvent
        .split(/\r?\n/)
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart());

      if (dataLines.length === 0) {
        return [] as StreamedChatChunk[];
      }

      const payloadText = dataLines.join("\n").trim();
      if (!payloadText || payloadText === "[DONE]") {
        return [] as StreamedChatChunk[];
      }

      let payload: any;
      try {
        payload = JSON.parse(payloadText);
      } catch {
        return [] as StreamedChatChunk[];
      }

      const chunkModel = String(payload?.model || model).trim() || model;
      const delta =
        this.extractTextContent(payload?.choices?.[0]?.delta?.content) ||
        this.extractTextContent(payload?.choices?.[0]?.message?.content);

      if (!delta) {
        return [] as StreamedChatChunk[];
      }

      return [{ model: chunkModel, delta }];
    };

    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done });

      while (true) {
        const separator = buffer.match(/\r?\n\r?\n/);
        if (separator?.index === undefined) {
          break;
        }

        const rawEvent = buffer.slice(0, separator.index);
        buffer = buffer.slice(separator.index + separator[0].length);

        for (const chunk of consumeEvent(rawEvent)) {
          yield chunk;
        }
      }

      if (done) {
        if (buffer.trim()) {
          for (const chunk of consumeEvent(buffer)) {
            yield chunk;
          }
        }
        break;
      }
    }
  }

  async planChatAction(input: {
    actor: { id: string; role: string };
    message: string;
    history: Array<{ role: string; content: string }>;
  }) {
    const plannerMessages = [
      {
        role: "system",
        content: [
          "You are the planner for an AI-driven knowledge-base blog.",
          "Translate the user's message into at most one structured action.",
          `Supported actions: ${supportedKbActions.join(", ")}.`,
          'If no action should be executed, use "none".',
          "Return JSON only with this schema:",
          '{"intent":"...", "action":"retrieve|add|append|append-from-url|organize-entry|update-meta|delete|inspect-url|ingest-url|build|none", "args":{}, "title":"short label", "reply":"one short Chinese sentence to the user"}',
          "Rules:",
          "- Prefer retrieve for questions, search, lookups, and reading requests.",
          "- Prefer add only when the user clearly wants a new note created.",
          "- Prefer append for adding content to an existing note.",
          "- Prefer append-from-url when a URL should be analyzed first and then appended to an existing note.",
          "- Prefer organize-entry when the user wants a note moved out of 待整理 or reassigned to a section.",
          "- Prefer update-meta only for metadata edits like title, summary, tags, aliases, or category.",
          "- Prefer delete only when the user explicitly asks to delete.",
          "- Prefer inspect-url or ingest-url only when a URL is present.",
          "- Prefer build when user asks to organize/rebuild/refresh the whole knowledge base or index.",
          "- Never invent file paths. Use slug/title references from the user.",
          "- Keep args minimal and only include keys required by the chosen action.",
        ].join("\n"),
      },
      ...input.history,
      {
        role: "user",
        content: `Current actor: ${input.actor.id} (${input.actor.role})\nUser message: ${input.message}`,
      },
    ];
    const result = await this.callChatModel(plannerMessages);
    const plan = this.extractJsonFromText(result.content);
    return {
      model: result.model,
      plan: {
        intent: String(plan.intent || "").trim(),
        action: String(plan.action || "none").trim(),
        args: this.normalizePlannedArgs(
          String(plan.action || "none").trim(),
          plan.args,
          input.message,
        ),
        title: String(plan.title || "AI 计划").trim() || "AI 计划",
        reply: String(plan.reply || "").trim(),
      },
    };
  }

  async summarizeActionResult(input: {
    actor: { id: string; role: string };
    message: string;
    plan: { action: string; args: Record<string, unknown> };
    execution: unknown;
  }) {
    const summaryMessages = this.buildSummaryMessages(input);
    const result = await this.callChatModel(summaryMessages);
    return { model: result.model, content: result.content.trim() };
  }

  async *summarizeActionResultStream(input: {
    actor: { id: string; role: string };
    message: string;
    plan: { action: string; args: Record<string, unknown> };
    execution: unknown;
  }) {
    const summaryMessages = this.buildSummaryMessages(input);
    for await (const chunk of this.streamChatModel(summaryMessages)) {
      yield chunk;
    }
  }

  buildSummaryMessages(input: {
    actor: { id: string; role: string };
    message: string;
    plan: { action: string; args: Record<string, unknown> };
    execution: unknown;
  }) {
    return [
      {
        role: "system",
        content: [
          "You are the assistant in an AI-driven knowledge-base blog.",
          "Respond in concise Chinese.",
          "Base your answer only on the execution result provided.",
          "If the action is retrieve, summarize matched notes and mention uncertainty when results are weak.",
          "If the action changed data, clearly say what changed.",
        ].join("\n"),
      },
      {
        role: "user",
        content: [
          `Actor: ${input.actor.id} (${input.actor.role})`,
          `Original message: ${input.message}`,
          `Planned action: ${input.plan.action}`,
          `Args: ${JSON.stringify(input.plan.args, null, 2)}`,
          `Execution result: ${JSON.stringify(input.execution, null, 2)}`,
        ].join("\n\n"),
      },
    ];
  }
}
