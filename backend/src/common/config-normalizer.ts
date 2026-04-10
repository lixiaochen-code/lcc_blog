import { RuntimeConfig, RuntimePlatform } from "./types";

const allowedProtocols = new Set(["http", "https"]);

function normalizeProtocol(value: unknown): "http" | "https" {
  const normalized = String(value || "https").trim().toLowerCase();
  return allowedProtocols.has(normalized) && normalized === "http" ? "http" : "https";
}

function normalizeBaseUrl(value: unknown): string {
  return String(value || "")
    .trim()
    .replace(/\/+$/, "")
    .replace(/^https?:\/\//i, "");
}

function normalizeModel(value: unknown): string {
  return String(value || "").trim();
}

function normalizePlatform(platform: Partial<RuntimePlatform>, index: number): RuntimePlatform {
  const id = String(platform.id || platform.name || `platform-${index + 1}`).trim() || `platform-${index + 1}`;
  const name = String(platform.name || `Platform ${index + 1}`).trim() || `Platform ${index + 1}`;
  const protocol = normalizeProtocol(platform.protocol);
  const baseUrl = normalizeBaseUrl(platform.baseUrl);
  const apiKey = String(platform.apiKey || "").trim();
  const models = Array.from(new Set((platform.models || []).map(normalizeModel).filter(Boolean)));
  return { id, name, protocol, baseUrl, apiKey, models };
}

export function normalizeRuntimeConfig(raw: Partial<RuntimeConfig> & Record<string, any>): RuntimeConfig {
  const rawPlatforms = Array.isArray(raw.platforms) && raw.platforms.length > 0
    ? raw.platforms
    : [{
        id: "default",
        name: "Default",
        protocol: raw?.server?.protocol || "https",
        baseUrl: raw?.server?.baseUrl || "",
        apiKey: raw?.credentials?.apiKey || "",
        models: [raw?.model?.selected || ""].filter(Boolean),
      }];

  const platforms = rawPlatforms
    .map((platform, index) => normalizePlatform(platform, index))
    .filter((platform) => platform.baseUrl && platform.models.length > 0);

  const selectedPlatformId = String(raw?.selection?.platformId || "").trim();
  const activePlatform = platforms.find((item) => item.id === selectedPlatformId) || platforms[0] || {
    id: "",
    name: "",
    protocol: "https" as const,
    baseUrl: "",
    apiKey: "",
    models: [],
  };
  const requestedModel = String(raw?.selection?.model || "").trim();
  const selectedModel = activePlatform.models.includes(requestedModel)
    ? requestedModel
    : activePlatform.models[0] || "";

  return {
    meta: raw.meta || {},
    auth: raw.auth || {},
    platforms,
    selection: {
      platformId: activePlatform.id,
      model: selectedModel,
    },
    permissions: raw.permissions || {},
    server: {
      mode: "direct",
      protocol: activePlatform.protocol,
      baseUrl: activePlatform.baseUrl,
    },
    model: {
      selected: selectedModel,
    },
    credentials: {
      apiKey: activePlatform.apiKey,
    },
  };
}

export function maskApiKey(value: string): string {
  if (!value) return "";
  if (value.length <= 8) return `${value.slice(0, 2)}***${value.slice(-1)}`;
  return `${value.slice(0, 4)}***${value.slice(-4)}`;
}

