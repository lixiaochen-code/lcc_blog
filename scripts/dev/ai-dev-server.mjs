import http from "node:http";
import { spawnSync } from "node:child_process";
import path from "node:path";
import crypto from "node:crypto";
import fs from "node:fs";
import { ProxyAgent } from "undici";
import { ensureDir, readJson, writeJson } from "../kb/shared.mjs";

const PORT = Number(process.env.AI_DEV_PORT || 3030);
const projectRoot = process.cwd();
const runtimeLocalPath = path.join(projectRoot, "data", "ai-runtime.local.json");
const runtimeTemplatePath = path.join(projectRoot, "data", "ai-runtime.example.json");
const accessLocalPath = path.join(projectRoot, "data", "ai-access.local.json");
const accessTemplatePath = path.join(projectRoot, "data", "ai-access.example.json");
const sessionsLocalPath = path.join(projectRoot, "data", "ai-sessions.local.json");
const serverLogPath = path.join(projectRoot, "data", "ai-server.log");
const MODEL_TIMEOUT_MS = Number(process.env.AI_MODEL_TIMEOUT_MS || 30000);

function normalizeProxyUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }
  if (/^https?:\/\//i.test(raw) || /^socks5?:\/\//i.test(raw)) {
    return raw;
  }
  return `http://${raw}`;
}

function getProxyUrl() {
  return normalizeProxyUrl(process.env.AI_URL_PROXY);
}

const actionPermissions = {
  retrieve: "notes.read",
  add: "notes.create",
  append: "notes.update",
  "update-meta": "notes.update",
  delete: "notes.delete",
  "inspect-url": "notes.read",
  "ingest-url": "kb.ingest_url",
  build: "site.build",
};

const supportedKbActions = Object.keys(actionPermissions);
const authSessions = new Map(Object.entries(readJson(sessionsLocalPath, { sessions: {} })?.sessions || {}));
const proxyUrl = getProxyUrl();
const proxyAgent = proxyUrl ? new ProxyAgent(proxyUrl) : null;

function appendServerLog(record = {}) {
  ensureDir(path.dirname(serverLogPath));
  const line = JSON.stringify({
    time: new Date().toISOString(),
    ...record,
  });
  fs.appendFileSync(serverLogPath, `${line}\n`, "utf8");
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  response.end(`${JSON.stringify(payload, null, 2)}\n`);
}

function parseRequestBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8").trim();
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new Error("Invalid JSON body."));
      }
    });
    request.on("error", reject);
  });
}

function runNodeScript(relativeScriptPath, args = []) {
  const result = spawnSync(process.execPath, [path.join(projectRoot, relativeScriptPath), ...args], {
    cwd: projectRoot,
    encoding: "utf8",
  });

  const stdout = String(result.stdout || "").trim();
  const stderr = String(result.stderr || "").trim();
  let payload = null;

  if (stdout) {
    try {
      payload = JSON.parse(stdout);
    } catch (error) {
      payload = { ok: result.status === 0, raw: stdout };
    }
  }

  return {
    ok: result.status === 0,
    status: result.status ?? 1,
    payload,
    stderr,
  };
}

function loadRuntimeConfig() {
  return readJson(runtimeLocalPath, readJson(runtimeTemplatePath, {})) || {};
}

function normalizeProtocol(value) {
  const normalized = String(value || "https").trim().toLowerCase();
  return normalized === "http" ? "http" : "https";
}

function normalizeBaseUrl(value) {
  return String(value || "")
    .trim()
    .replace(/\/+$/, "")
    .replace(/^https?:\/\//i, "");
}

function normalizeModel(value) {
  return String(value || "").trim();
}

function normalizeRuntimeConfig(config = {}) {
  const rawPlatforms = Array.isArray(config.platforms) && config.platforms.length > 0
    ? config.platforms
    : [
        {
          id: "default",
          name: "Default",
          protocol: config?.server?.protocol || "https",
          baseUrl: config?.server?.baseUrl || "",
          apiKey: config?.credentials?.apiKey || "",
          models: [config?.model?.selected || ""].filter(Boolean),
        },
      ];

  const platforms = rawPlatforms
    .map((platform, index) => ({
      id: String(platform?.id || platform?.name || `platform-${index + 1}`).trim(),
      name: String(platform?.name || `Platform ${index + 1}`).trim(),
      protocol: normalizeProtocol(platform?.protocol || "https"),
      baseUrl: normalizeBaseUrl(platform?.baseUrl || ""),
      apiKey: String(platform?.apiKey || "").trim(),
      models: Array.from(
        new Set(
          (Array.isArray(platform?.models) ? platform.models : [])
            .map((item) => normalizeModel(item))
            .filter(Boolean)
        )
      ),
    }))
    .filter((platform) => platform.baseUrl && platform.models.length > 0);

  const activePlatform =
    platforms.find((item) => item.id === String(config?.selection?.platformId || "").trim()) || platforms[0] || null;
  const selectedModel = activePlatform?.models.includes(String(config?.selection?.model || "").trim())
    ? String(config.selection.model).trim()
    : activePlatform?.models[0] || "";

  return {
    ...config,
    platforms,
    selection: {
      platformId: activePlatform?.id || "",
      model: selectedModel,
    },
    server: {
      mode: "direct",
      protocol: activePlatform?.protocol || "https",
      baseUrl: activePlatform?.baseUrl || "",
    },
    model: {
      selected: selectedModel,
    },
    credentials: {
      apiKey: activePlatform?.apiKey || "",
    },
  };
}

function persistSessions() {
  ensureDir(path.dirname(sessionsLocalPath));
  writeJson(sessionsLocalPath, {
    sessions: Object.fromEntries(authSessions.entries()),
  });
}

function normalizeAccessRole(role) {
  const normalized = String(role || "").trim().toLowerCase();
  if (normalized === "owner") {
    return "super_admin";
  }
  if (["editor", "viewer", "admin"].includes(normalized)) {
    return "admin";
  }
  return normalized || "admin";
}

function normalizeAccessUser(user = {}) {
  return {
    ...user,
    role: normalizeAccessRole(user.role),
    status: String(user.status || "active").trim().toLowerCase() === "suspended" ? "suspended" : "active",
    permissions: Array.isArray(user.permissions) ? user.permissions : [],
  };
}

function loadAccessConfig() {
  const raw = readJson(accessLocalPath, readJson(accessTemplatePath, { users: [] })) || { users: [] };
  return {
    ...raw,
    users: Array.isArray(raw.users) ? raw.users.map(normalizeAccessUser) : [],
  };
}

function sanitizeRuntimeConfig(config) {
  const normalized = normalizeRuntimeConfig(config);
  const apiKey = String(config?.credentials?.apiKey || "");
  const maskedKey = apiKey
    ? apiKey.length <= 8
      ? `${apiKey.slice(0, 2)}***${apiKey.slice(-1)}`
      : `${apiKey.slice(0, 4)}***${apiKey.slice(-4)}`
    : "";

  return {
    ...normalized,
    platforms: (normalized.platforms || []).map((platform) => ({
      ...platform,
      apiKey: platform.apiKey
        ? platform.apiKey.length <= 8
          ? `${platform.apiKey.slice(0, 2)}***${platform.apiKey.slice(-1)}`
          : `${platform.apiKey.slice(0, 4)}***${platform.apiKey.slice(-4)}`
        : "",
    })),
    credentials: {
      ...(normalized.credentials || {}),
      apiKey: maskedKey,
    },
  };
}

function getUserOrThrow(userId) {
  const config = loadAccessConfig();
  const user = (config.users || []).find((item) => item.id === userId);
  if (!user) {
    throw new Error(`Unknown user: ${userId}`);
  }
  if (user.status !== "active") {
    throw new Error(`User is not active: ${userId}`);
  }
  return user;
}

function getBearerToken(request) {
  const header = String(request.headers.authorization || "").trim();
  if (!header.toLowerCase().startsWith("bearer ")) {
    return "";
  }
  return header.slice(7).trim();
}

function getAuthenticatedUser(request) {
  const token = getBearerToken(request);
  if (!token) {
    throw new Error("Not authenticated.");
  }

  const userId = authSessions.get(token);
  if (!userId) {
    throw new Error("Session expired or invalid.");
  }

  return getUserOrThrow(userId);
}

function requirePermission(userId, permission) {
  const user = getUserOrThrow(userId);
  if (!permission) {
    return user;
  }
  if (!(user.permissions || []).includes(permission)) {
    throw new Error(`Permission denied for ${userId}: ${permission}`);
  }
  return user;
}

function requireOwner(userId) {
  const user = getUserOrThrow(userId);
  if (user.role !== "super_admin") {
    throw new Error("Only super_admin can perform this action.");
  }
  return user;
}

function requireAuthenticatedPermission(request, permission) {
  const user = getAuthenticatedUser(request);
  return requirePermission(user.id, permission);
}

function requireAuthenticatedSuperAdmin(request) {
  const user = getAuthenticatedUser(request);
  if (user.role !== "super_admin") {
    throw new Error("Only super_admin can perform this action.");
  }
  return user;
}

function buildArgsFromRecord(record = {}) {
  return Object.entries(record).flatMap(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return [];
    }
    return [`--${key}`, String(value)];
  });
}

function normalizePlannedArgs(action, args, message) {
  const nextArgs = typeof args === "object" && args ? { ...args } : {};
  const fallbackMessage = String(message || "").trim();

  if (action === "retrieve" && !String(nextArgs.query || "").trim()) {
    nextArgs.query = fallbackMessage;
  }

  if ((action === "inspect-url" || action === "ingest-url") && !String(nextArgs.url || "").trim()) {
    const matchedUrl = fallbackMessage.match(/https?:\/\/\S+/i);
    if (matchedUrl) {
      nextArgs.url = matchedUrl[0];
    }
  }

  return nextArgs;
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter((entry) => entry && ["user", "assistant"].includes(entry.role))
    .slice(-8)
    .map((entry) => ({
      role: entry.role,
      content: String(entry.content || "").trim(),
    }))
    .filter((entry) => entry.content);
}

function detectDirectAction(message) {
  const text = String(message || "").trim().toLowerCase();
  if (!text) {
    return null;
  }

  const matchedUrl = text.match(/https?:\/\/\S+/i)?.[0] || "";
  const wantsProjectSummary = /这个项目|项目主要|项目是干什么|what.*project|about.*project/.test(text);
  const wantsIngest = /导入|收录|保存到知识库|ingest/.test(text);
  if (matchedUrl && !wantsIngest && wantsProjectSummary) {
    return {
      intent: "inspect external url and summarize project purpose",
      action: "inspect-url",
      args: { url: matchedUrl },
      title: "解析链接内容",
      reply: "收到，我先解析这个链接并给你总结项目用途。",
    };
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

function extractJsonFromText(text) {
  const raw = String(text || "").trim();
  if (!raw) {
    throw new Error("Model returned empty content.");
  }

  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : raw;

  try {
    return JSON.parse(candidate);
  } catch (error) {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1));
    }
    throw new Error("Failed to parse model JSON output.");
  }
}

async function callChatModel(messages) {
  const runtime = normalizeRuntimeConfig(loadRuntimeConfig());
  const protocol = String(runtime?.server?.protocol || "https").trim() || "https";
  const baseUrl = String(runtime?.server?.baseUrl || "").trim().replace(/\/+$/, "");
  const model = String(runtime?.model?.selected || "").trim();
  const apiKey = String(runtime?.credentials?.apiKey || "").trim();

  if (!baseUrl || !model || !apiKey) {
    throw new Error("AI runtime is not ready. Please configure baseUrl, model, and apiKey first.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS);
  let response;
  try {
    response = await fetch(`${protocol}://${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages,
      }),
      signal: controller.signal,
      ...(proxyAgent ? { dispatcher: proxyAgent } : {}),
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(`Upstream model timeout after ${MODEL_TIMEOUT_MS}ms.`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || data?.message || "Upstream model request failed.");
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Upstream model returned no content.");
  }

  return {
    model,
    content: String(content),
    raw: data,
  };
}

async function planChatAction({ actor, message, history }) {
  const plannerMessages = [
    {
      role: "system",
      content: [
        "You are the planner for an AI-driven knowledge-base blog.",
        "Translate the user's message into at most one structured action.",
        `Supported actions: ${supportedKbActions.join(", ")}.`,
        'If no action should be executed, use "none".',
        "Return JSON only with this schema:",
        '{"intent":"...", "action":"retrieve|add|append|update-meta|delete|inspect-url|ingest-url|build|none", "args":{}, "title":"short label", "reply":"one short Chinese sentence to the user"}',
        "Rules:",
        "- Prefer retrieve for questions, search, lookups, and reading requests.",
        "- Prefer add only when the user clearly wants a new note created.",
        "- Prefer append for adding content to an existing note.",
        "- Prefer update-meta only for metadata edits like title, summary, tags, aliases, or category.",
        "- Prefer delete only when the user explicitly asks to delete.",
        "- Prefer inspect-url or ingest-url only when a URL is present.",
        "- Prefer build when user asks to organize/rebuild/refresh the whole knowledge base or index.",
        "- Never invent file paths. Use slug/title references from the user.",
        "- Keep args minimal and only include keys required by the chosen action.",
      ].join("\n"),
    },
    ...history,
    {
      role: "user",
      content: `Current actor: ${actor.id} (${actor.role})\nUser message: ${message}`,
    },
  ];

  const result = await callChatModel(plannerMessages);
  const plan = extractJsonFromText(result.content);

  return {
    model: result.model,
    plan: {
      intent: String(plan.intent || "").trim(),
      action: String(plan.action || "none").trim(),
      args: normalizePlannedArgs(String(plan.action || "none").trim(), plan.args, message),
      title: String(plan.title || "AI 计划").trim() || "AI 计划",
      reply: String(plan.reply || "").trim(),
    },
  };
}

async function summarizeActionResult({ actor, message, plan, execution }) {
  const summaryMessages = [
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
        `Actor: ${actor.id} (${actor.role})`,
        `Original message: ${message}`,
        `Planned action: ${plan.action}`,
        `Args: ${JSON.stringify(plan.args, null, 2)}`,
        `Execution result: ${JSON.stringify(execution, null, 2)}`,
      ].join("\n\n"),
    },
  ];

  const result = await callChatModel(summaryMessages);
  return {
    model: result.model,
    content: result.content.trim(),
  };
}

async function handleRequest(request, response) {
  if (request.method === "OPTIONS") {
    sendJson(response, 204, { ok: true });
    return;
  }

  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

  try {
    if (request.method === "GET" && url.pathname === "/api/health") {
      sendJson(response, 200, {
        ok: true,
        status: "ready",
        port: PORT,
        runtimeSource: readJson(runtimeLocalPath, null) ? "local" : "template",
        accessSource: readJson(accessLocalPath, null) ? "local" : "template",
      });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/runtime-config") {
      requireAuthenticatedSuperAdmin(request);
      sendJson(response, 200, { ok: true, config: sanitizeRuntimeConfig(loadRuntimeConfig()) });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/runtime-config") {
      requireAuthenticatedSuperAdmin(request);
      const body = await parseRequestBody(request);
      const result = runNodeScript("scripts/kb/runtime-config.mjs", [
        "--action",
        "set",
        ...buildArgsFromRecord(
          body.platforms
            ? {
                configJson: JSON.stringify({
                  platforms: body.platforms,
                  selection: body.selection,
                }),
              }
            : {
                protocol: body.protocol,
                baseUrl: body.baseUrl,
                model: body.model,
                apiKey: body.apiKey,
              }
        ),
      ]);

      sendJson(response, result.ok ? 200 : 400, {
        ok: result.ok,
        result: result.payload,
        stderr: result.stderr,
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/login") {
      const body = await parseRequestBody(request);
      const userId = String(body.userId || "").trim();
      const name = String(body.name || "").trim();
      if (!userId || !name) {
        throw new Error("Missing userId or name.");
      }

      const user = getUserOrThrow(userId);
      if (String(user.name || "").trim() !== name) {
        throw new Error("Name and userId do not match.");
      }
      const token = crypto.randomBytes(24).toString("hex");
      authSessions.set(token, user.id);
      persistSessions();

      sendJson(response, 200, {
        ok: true,
        token,
        user,
      });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/auth/session") {
      const user = getAuthenticatedUser(request);
      sendJson(response, 200, {
        ok: true,
        user,
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/logout") {
      const token = getBearerToken(request);
      if (token) {
        authSessions.delete(token);
        persistSessions();
      }
      sendJson(response, 200, { ok: true });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/access") {
      const currentUser = getAuthenticatedUser(request);
      const config = loadAccessConfig();
      sendJson(response, 200, {
        ok: true,
        currentUser,
        users: currentUser.role === "super_admin" ? config.users || [] : [],
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/access/add-user") {
      const actor = requireAuthenticatedSuperAdmin(request);
      const body = await parseRequestBody(request);
      const result = runNodeScript("scripts/kb/access-control.mjs", [
        "--action",
        "add-user",
        ...buildArgsFromRecord({
          name: body.name,
          role: body.role,
          approvedBy: actor.id,
        }),
      ]);
      sendJson(response, result.ok ? 200 : 400, { ok: result.ok, result: result.payload, stderr: result.stderr });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/access/delete-user") {
      requireAuthenticatedSuperAdmin(request);
      const body = await parseRequestBody(request);
      const result = runNodeScript("scripts/kb/access-control.mjs", [
        "--action",
        "delete-user",
        ...buildArgsFromRecord({ id: body.id }),
      ]);
      sendJson(response, result.ok ? 200 : 400, { ok: result.ok, result: result.payload, stderr: result.stderr });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/access/set-role") {
      requireAuthenticatedSuperAdmin(request);
      const body = await parseRequestBody(request);
      const result = runNodeScript("scripts/kb/access-control.mjs", [
        "--action",
        "set-role",
        ...buildArgsFromRecord({ id: body.id, role: body.role }),
      ]);
      sendJson(response, result.ok ? 200 : 400, { ok: result.ok, result: result.payload, stderr: result.stderr });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/access/grant") {
      requireAuthenticatedSuperAdmin(request);
      const body = await parseRequestBody(request);
      const result = runNodeScript("scripts/kb/access-control.mjs", [
        "--action",
        "grant",
        ...buildArgsFromRecord({ id: body.id, permission: body.permission }),
      ]);
      sendJson(response, result.ok ? 200 : 400, { ok: result.ok, result: result.payload, stderr: result.stderr });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/access/revoke") {
      requireAuthenticatedSuperAdmin(request);
      const body = await parseRequestBody(request);
      const result = runNodeScript("scripts/kb/access-control.mjs", [
        "--action",
        "revoke",
        ...buildArgsFromRecord({ id: body.id, permission: body.permission }),
      ]);
      sendJson(response, result.ok ? 200 : 400, { ok: result.ok, result: result.payload, stderr: result.stderr });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/access/set-quota") {
      requireAuthenticatedSuperAdmin(request);
      const body = await parseRequestBody(request);
      const result = runNodeScript("scripts/kb/access-control.mjs", [
        "--action",
        "set-quota",
        ...buildArgsFromRecord({
          id: body.id,
          dailyRequests: body.dailyRequests,
          monthlyTokens: body.monthlyTokens,
        }),
      ]);
      sendJson(response, result.ok ? 200 : 400, { ok: result.ok, result: result.payload, stderr: result.stderr });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/access/suspend") {
      requireAuthenticatedSuperAdmin(request);
      const body = await parseRequestBody(request);
      const result = runNodeScript("scripts/kb/access-control.mjs", [
        "--action",
        "suspend",
        ...buildArgsFromRecord({ id: body.id }),
      ]);
      sendJson(response, result.ok ? 200 : 400, { ok: result.ok, result: result.payload, stderr: result.stderr });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/access/activate") {
      requireAuthenticatedSuperAdmin(request);
      const body = await parseRequestBody(request);
      const result = runNodeScript("scripts/kb/access-control.mjs", [
        "--action",
        "activate",
        ...buildArgsFromRecord({ id: body.id }),
      ]);
      sendJson(response, result.ok ? 200 : 400, { ok: result.ok, result: result.payload, stderr: result.stderr });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/chat") {
      const startedAt = Date.now();
      const actor = requireAuthenticatedPermission(request, "tokens.use");
      const body = await parseRequestBody(request);
      const message = String(body.message || "").trim();
      if (!message) {
        throw new Error("Missing chat message.");
      }

      const history = normalizeHistory(body.history);
      const plannerStartedAt = Date.now();
      const directPlan = detectDirectAction(message);
      const { model: plannerModel, plan } = directPlan
        ? { model: "rule-based", plan: directPlan }
        : await planChatAction({
            actor,
            message,
            history,
          });
      const plannerDurationMs = Date.now() - plannerStartedAt;

      if (plan.action === "none") {
        appendServerLog({
          endpoint: "/api/chat",
          actorId: actor.id,
          action: "none",
          plannerModel,
          plannerDurationMs,
          totalDurationMs: Date.now() - startedAt,
        });
        sendJson(response, 200, {
          ok: true,
          actorId: actor.id,
          plannedBy: plannerModel,
          plan,
          executed: false,
          allowed: true,
          assistantMessage: plan.reply || "这次不需要执行知识库动作，我先直接回复你。",
        });
        return;
      }

      if (!actionPermissions[plan.action]) {
        throw new Error(`Unsupported planned action: ${plan.action}`);
      }

      const permissionRequired = actionPermissions[plan.action];
      const allowed = (actor.permissions || []).includes(permissionRequired);

      if (!allowed) {
        appendServerLog({
          endpoint: "/api/chat",
          actorId: actor.id,
          action: plan.action,
          plannerModel,
          plannerDurationMs,
          allowed: false,
          permissionRequired,
          totalDurationMs: Date.now() - startedAt,
        });
        sendJson(response, 200, {
          ok: true,
          actorId: actor.id,
          plannedBy: plannerModel,
          plan,
          executed: false,
          allowed: false,
          permissionRequired,
          assistantMessage: `我理解你的意图是执行 ${plan.action}，但你当前没有 ${permissionRequired} 权限，所以这次不能执行。`,
        });
        return;
      }

      const execution = plan.action === "build"
        ? runNodeScript("scripts/kb/build.mjs")
        : runNodeScript("scripts/kb/agent.mjs", [
            "--action",
            plan.action,
            ...buildArgsFromRecord(plan.args || {}),
          ]);
      const executionDurationMs = Date.now() - plannerStartedAt - plannerDurationMs;
      const executionPayload = execution.payload || { ok: execution.ok, stderr: execution.stderr };

      let assistantMessage = plan.reply || `已执行 ${plan.action}。`;
      let respondedBy = plannerModel;

      if (execution.ok) {
        const summaryStartedAt = Date.now();
        const summary = await summarizeActionResult({
          actor,
          message,
          plan,
          execution: executionPayload,
        });
        assistantMessage = summary.content || assistantMessage;
        respondedBy = summary.model || respondedBy;
        appendServerLog({
          endpoint: "/api/chat",
          actorId: actor.id,
          action: plan.action,
          plannerModel,
          respondedBy,
          plannerDurationMs,
          executionDurationMs,
          summaryDurationMs: Date.now() - summaryStartedAt,
          executionOk: true,
          totalDurationMs: Date.now() - startedAt,
        });
      } else {
        appendServerLog({
          endpoint: "/api/chat",
          actorId: actor.id,
          action: plan.action,
          plannerModel,
          plannerDurationMs,
          executionDurationMs,
          executionOk: false,
          totalDurationMs: Date.now() - startedAt,
        });
      }

      sendJson(response, execution.ok ? 200 : 400, {
        ok: execution.ok,
        actorId: actor.id,
        plannedBy: plannerModel,
        respondedBy,
        plan,
        executed: execution.ok,
        allowed: true,
        permissionRequired,
        result: executionPayload,
        stderr: execution.stderr,
        assistantMessage,
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/kb/action") {
      const body = await parseRequestBody(request);
      const action = String(body.action || "").trim();
      if (!actionPermissions[action]) {
        throw new Error(`Unsupported kb action: ${action}`);
      }

      const actor = requireAuthenticatedPermission(request, actionPermissions[action]);

      const args = ["--action", action, ...buildArgsFromRecord(body.args || {})];
      const result = runNodeScript("scripts/kb/agent.mjs", args);

      sendJson(response, result.ok ? 200 : 400, {
        ok: result.ok,
        action,
        actorId: actor.id,
        result: result.payload,
        stderr: result.stderr,
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/kb/build") {
      const actor = requireAuthenticatedPermission(request, "site.build");
      const result = runNodeScript("scripts/kb/build.mjs");

      sendJson(response, result.ok ? 200 : 400, {
        ok: result.ok,
        actorId: actor.id,
        result: result.payload || { ok: result.ok, message: result.ok ? "Knowledge base built." : "Build failed." },
        stderr: result.stderr,
      });
      return;
    }

    sendJson(response, 404, { ok: false, error: "Not found." });
  } catch (error) {
    sendJson(response, 400, {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown server error.",
    });
  }
}

const server = http.createServer((request, response) => {
  handleRequest(request, response);
});

server.listen(PORT, () => {
  appendServerLog({
    event: "server_started",
    server: "legacy-http",
    port: PORT,
    cwd: process.cwd(),
  });
  console.log(`AI dev server listening on http://localhost:${PORT}`);
});
