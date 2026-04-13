import http from "node:http";
import { URL } from "node:url";
import { createContext, createFallbackAnswer, findNote, listNotes, loadKnowledgeBase, searchNotes } from "./lib/knowledge.js";
import {
  createRemoteFallbackAnswer,
  inspectRemoteResource,
} from "./lib/remote.js";
import { callModelWithMessages, callRemoteModel, inspectRuntime } from "./lib/runtime.js";
import type { ChatMessage, ModelMessage, ModelToolDefinition } from "./lib/types.js";

const port = Number(process.env.AI_DEV_PORT || 3030);

function json(response: http.ServerResponse, status: number, payload: unknown) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  response.end(`${JSON.stringify(payload, null, 2)}\n`);
}

function notFound(response: http.ServerResponse) {
  json(response, 404, { ok: false, error: "Not found" });
}

function parseBody(request: http.IncomingMessage) {
  return new Promise<Record<string, unknown>>((resolve, reject) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8").trim();
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw) as Record<string, unknown>);
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    request.on("error", reject);
  });
}

const agentTools: ModelToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "search_local_notes",
      description: "在本地知识库里搜索和用户问题相关的笔记。",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "用于搜索本地知识库的查询词" },
          limit: { type: "number", description: "返回结果数量，建议 1 到 5" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "inspect_remote_resource",
      description: "查看用户提供的外部链接，比如 GitHub 仓库或网页，并提取摘要信息。",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "要查看的 URL" },
        },
        required: ["url"],
      },
    },
  },
];

function safeJsonParse(raw: string) {
  try {
    return JSON.parse(raw || "{}") as Record<string, unknown>;
  } catch {
    return {};
  }
}

function buildLocalToolPayload(query: string, limit: number) {
  const base = loadKnowledgeBase();
  const matches = searchNotes(base, query, Math.min(Math.max(limit || 4, 1), 5));
  return {
    query,
    results: matches.map((item) => ({
      id: item.note.id,
      title: item.note.title,
      summary: item.note.summary,
      url: item.note.url,
      section: item.note.sectionTitle,
      score: item.score,
      excerpt: item.note.excerpt,
      tags: item.note.tags,
    })),
  };
}

async function runAgentTool(toolName: string, args: Record<string, unknown>) {
  if (toolName === "search_local_notes") {
    return buildLocalToolPayload(String(args.query || ""), Number(args.limit || 4));
  }

  if (toolName === "inspect_remote_resource") {
    return await inspectRemoteResource(String(args.url || ""));
  }

  return {
    error: `Unsupported tool: ${toolName}`,
  };
}

async function runToolCallingAgent(options: {
  message: string;
  history: ChatMessage[];
}) {
  const systemPrompt = [
    "你是一个个人知识库助手，必须优先依赖工具获得信息。",
    "你可以主动调用两个工具：search_local_notes 和 inspect_remote_resource。",
    "当用户提到某个链接、项目、仓库、网页时，优先调用 inspect_remote_resource。",
    "当用户询问仓库或网页的后续追问，例如“再总结一下这个项目”“详细一点”，如果历史对话里已经出现过链接，也应该继续围绕同一个外部资源调用工具，而不是猜测。",
    "只有在拿到足够的工具结果后，才能给最终回答。",
    "如果信息仍然不足，要明确说出不足在哪里。",
    "最终回答使用简洁但清楚的中文。",
  ].join("\n");

  const messages: ModelMessage[] = [
    { role: "system", content: systemPrompt },
    ...options.history.map((item) => ({ role: item.role, content: item.content })),
    { role: "user", content: options.message },
  ];
  const toolTraces: Array<{ name: string; result: unknown }> = [];

  for (let step = 0; step < 4; step += 1) {
    const result = await callModelWithMessages({
      messages,
      tools: agentTools,
      toolChoice: "auto",
      temperature: 0.1,
    });

    if (!result) {
      return null;
    }

    if (!result.toolCalls.length) {
      return {
        answer: result.content,
        toolTraces,
      };
    }

    messages.push({
      role: "assistant",
      content: result.content || "",
      tool_calls: result.toolCalls,
    });

    for (const toolCall of result.toolCalls) {
      const args = safeJsonParse(toolCall.function.arguments);
      const toolResult = await runAgentTool(toolCall.function.name, args);
      toolTraces.push({
        name: toolCall.function.name,
        result: toolResult,
      });
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        name: toolCall.function.name,
        content: JSON.stringify(toolResult, null, 2),
      });
    }
  }

  const finalResult = await callModelWithMessages({
    messages,
    toolChoice: "none",
    temperature: 0.1,
  });
  if (!finalResult) {
    return null;
  }

  return {
    answer: finalResult.content,
    toolTraces,
  };
}

async function handleChat(request: http.IncomingMessage, response: http.ServerResponse) {
  const body = await parseBody(request);
  const message = String(body.message ?? "").trim();
  const history = Array.isArray(body.history) ? (body.history as ChatMessage[]) : [];

  if (!message) {
    json(response, 400, { ok: false, error: "message is required" });
    return;
  }

  const runtime = inspectRuntime();
  const base = loadKnowledgeBase();
  const deterministicMatches = searchNotes(base, message, 4);
  const deterministicFallback = createFallbackAnswer(message, deterministicMatches);
  let answer = deterministicFallback.answer;
  let mode = "local-retrieval";
  let warning = "";
  let references = deterministicFallback.references;
  let matches = deterministicMatches.map((item) => ({
    id: item.note.id,
    title: item.note.title,
    summary: item.note.summary,
    url: item.note.url,
    score: item.score,
  }));
  let remoteResources: unknown[] = [];
  let context = createContext(message, deterministicMatches);

  if (runtime.configured) {
    try {
      const agentResult = await runToolCallingAgent({
        history,
        message,
      });

      if (agentResult?.answer) {
        answer = agentResult.answer;
        mode = "model-tool-calling";
        const searchTrace = agentResult.toolTraces
          .filter((item) => item.name === "search_local_notes")
          .flatMap((item) => {
            const result = item.result as { results?: Array<Record<string, unknown>> };
            return Array.isArray(result.results) ? result.results : [];
          });
        const remoteTrace = agentResult.toolTraces
          .filter((item) => item.name === "inspect_remote_resource")
          .map((item) => item.result);

        if (searchTrace.length) {
          matches = searchTrace.map((item) => ({
            id: String(item.id || ""),
            title: String(item.title || ""),
            summary: String(item.summary || ""),
            url: String(item.url || ""),
            score: Number(item.score || 0),
          }));
        }

        if (remoteTrace.length) {
          remoteResources = remoteTrace;
          references = remoteTrace.map((item) => {
            const resource = item as { url?: string; title?: string };
            return {
              id: String(resource.url || ""),
              title: String(resource.title || ""),
              url: String(resource.url || ""),
            };
          });
          const remoteFallback = createRemoteFallbackAnswer(
            message,
            remoteTrace as Array<{ url: string; title: string; summary: string; excerpt: string; source: string }>
          );
          if (remoteFallback?.references?.length) {
            references = remoteFallback.references;
          }
        }

        context = JSON.stringify(
          {
            toolsUsed: agentResult.toolTraces.map((item) => item.name),
            localMatches: matches,
            remoteResources,
          },
          null,
          2
        );
      } else if (deterministicMatches.length > 0) {
        const remote = await callRemoteModel({
          systemPrompt: [
            "你是一个个人知识库助手。",
            "只允许基于给定上下文回答，不要编造知识库里没有的信息。",
            "如果上下文不足，要明确说明不确定，并建议继续阅读参考笔记。",
            "",
            context,
          ].join("\n"),
          history,
          userMessage: message,
        });
        if (remote) {
          answer = remote;
          mode = "remote-model";
        }
      }
    } catch (error) {
      warning = error instanceof Error ? error.message : "模型调用失败，已降级到本地检索回答。";
    }
  }

  json(response, 200, {
    ok: true,
    mode,
    answer,
    context,
    warning,
    references,
    remoteResources,
    matches,
  });
}

const server = http.createServer(async (request, response) => {
  if (!request.url || !request.method) {
    notFound(response);
    return;
  }

  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    response.end();
    return;
  }

  try {
    const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
    const pathname = url.pathname;

    if (request.method === "GET" && pathname === "/api/health") {
      const base = loadKnowledgeBase();
      json(response, 200, {
        ok: true,
        service: "knowledge-api",
        generatedAt: base.generatedAt,
        noteCount: base.stats.totalNotes,
        ai: inspectRuntime(),
      });
      return;
    }

    if (request.method === "GET" && pathname === "/api/runtime") {
      json(response, 200, { ok: true, runtime: inspectRuntime() });
      return;
    }

    if (request.method === "GET" && pathname === "/api/notes") {
      const base = loadKnowledgeBase();
      const section = url.searchParams.get("section") ?? "";
      const tag = url.searchParams.get("tag") ?? "";
      const limit = Number(url.searchParams.get("limit") ?? 50);
      const query = url.searchParams.get("query") ?? "";

      const payload = query
        ? searchNotes(base, query, limit).map((item) => ({ ...item.note, score: item.score }))
        : listNotes(base, { section, tag, limit });

      json(response, 200, { ok: true, items: payload, stats: base.stats, sections: base.sections, tags: base.tags });
      return;
    }

    if (request.method === "GET" && pathname.startsWith("/api/notes/")) {
      const base = loadKnowledgeBase();
      const noteId = decodeURIComponent(pathname.slice("/api/notes/".length));
      const note = findNote(base, noteId);
      if (!note) {
        notFound(response);
        return;
      }

      json(response, 200, { ok: true, item: note });
      return;
    }

    if (request.method === "POST" && pathname === "/api/search") {
      const body = await parseBody(request);
      const query = String(body.query ?? "").trim();
      const limit = Number(body.limit ?? 5);
      const base = loadKnowledgeBase();
      const results = searchNotes(base, query, limit);

      json(response, 200, {
        ok: true,
        query,
        items: results.map((item) => ({
          ...item.note,
          score: item.score,
        })),
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/chat") {
      await handleChat(request, response);
      return;
    }

    notFound(response);
  } catch (error) {
    json(response, 500, {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown server error",
    });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Knowledge API listening on http://127.0.0.1:${port}`);
});
