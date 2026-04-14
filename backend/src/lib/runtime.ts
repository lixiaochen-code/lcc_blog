import fs from "node:fs";
import path from "node:path";
import type { ChatMessage, ModelMessage, ModelToolCall, ModelToolDefinition } from "./types.js";

type RuntimePlatform = {
  id: string;
  name: string;
  protocol: string;
  baseUrl: string;
  apiKey: string;
  models: string[];
};

type RuntimeConfig = {
  platforms?: RuntimePlatform[];
  selection?: {
    platformId?: string;
    model?: string;
  };
};

const projectRoot = process.cwd();
const localPath = path.join(projectRoot, "data", "ai-runtime.local.json");
const examplePath = path.join(projectRoot, "data", "ai-runtime.example.json");
const timeoutMs = Number(process.env.AI_MODEL_TIMEOUT_MS || 30000);

function loadRuntimeConfig(): RuntimeConfig | null {
  const filePath = fs.existsSync(localPath) ? localPath : examplePath;
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8")) as RuntimeConfig;
}

function getSelectedPlatform(config: RuntimeConfig | null) {
  const platforms = Array.isArray(config?.platforms) ? config!.platforms : [];
  const platformId = String(config?.selection?.platformId ?? "").trim();
  return platforms.find((platform) => platform.id === platformId) ?? platforms[0] ?? null;
}

export function inspectRuntime() {
  const config = loadRuntimeConfig();
  const platform = getSelectedPlatform(config);
  const selectedModel = String(config?.selection?.model ?? platform?.models?.[0] ?? "").trim();
  const apiKey = String(platform?.apiKey ?? "").trim();
  const configured = Boolean(platform?.baseUrl && selectedModel && apiKey && !apiKey.includes("YOUR_API_KEY_HERE"));

  return {
    configured,
    provider: platform?.name ?? "",
    model: selectedModel,
    baseUrl: platform?.baseUrl ?? "",
  };
}

function getRuntimeConnection() {
  const config = loadRuntimeConfig();
  const platform = getSelectedPlatform(config);
  const model = String(config?.selection?.model ?? platform?.models?.[0] ?? "").trim();
  const apiKey = String(platform?.apiKey ?? "").trim();

  if (!platform?.baseUrl || !model || !apiKey || apiKey.includes("YOUR_API_KEY_HERE")) {
    return null;
  }

  const protocol = String(platform.protocol || "https").replace(/:$/, "") || "https";
  const url = `${protocol}://${String(platform.baseUrl).replace(/^https?:\/\//, "").replace(/\/+$/, "")}/chat/completions`;
  return { url, model, apiKey };
}

export async function callModelWithMessages(options: {
  messages: ModelMessage[];
  tools?: ModelToolDefinition[];
  toolChoice?: "auto" | "none";
  temperature?: number;
}) {
  const connection = getRuntimeConnection();
  if (!connection) {
    return null;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(connection.url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${connection.apiKey}`,
      },
      body: JSON.stringify({
        model: connection.model,
        temperature: options.temperature ?? 0.2,
        messages: options.messages,
        ...(options.tools?.length
          ? {
              tools: options.tools,
              tool_choice: options.toolChoice ?? "auto",
            }
          : {}),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Model request failed: ${response.status} ${errorText}`.trim());
    }

    const payload = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string;
          tool_calls?: ModelToolCall[];
        };
      }>;
    };

    const message = payload.choices?.[0]?.message;
    return {
      content: message?.content?.trim() || "",
      toolCalls: Array.isArray(message?.tool_calls) ? message!.tool_calls : [],
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function callRemoteModel(options: {
  systemPrompt: string;
  history: ChatMessage[];
  userMessage: string;
}) {
  const result = await callModelWithMessages({
    messages: [
      { role: "system", content: options.systemPrompt },
      ...options.history,
      { role: "user", content: options.userMessage },
    ],
  });

  return result?.content || null;
}
