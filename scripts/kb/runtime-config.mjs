import path from "node:path";
import { dataDir, ensureDir, parseArgs, readJson, writeJson } from "./shared.mjs";

const templatePath = path.join(dataDir, "ai-runtime.example.json");
const localPath = path.join(dataDir, "ai-runtime.local.json");
const allowedProtocols = new Set(["http", "https"]);

function printAndExit(payload, code = 0) {
  console.log(`${JSON.stringify(payload, null, 2)}\n`);
  process.exit(code);
}

function defaultPlatform() {
  return {
    id: "siliconflow",
    name: "SiliconFlow",
    protocol: "https",
    baseUrl: "api.siliconflow.cn/v1",
    apiKey: "YOUR_API_KEY_HERE",
    models: ["deepseek-ai/DeepSeek-V3.2"],
  };
}

function defaultConfig() {
  const platform = defaultPlatform();

  return {
    meta: {
      version: 2,
      ownerManaged: true,
      singleModelOnly: true,
      dockerRequired: false,
      description: "Runtime settings for the production AI tool. Intended to run directly on a server process without Docker.",
    },
    auth: {
      provider: "owner-managed",
      inviteOnly: true,
    },
    platforms: [platform],
    selection: {
      platformId: platform.id,
      model: platform.models[0],
    },
    permissions: {
      ownerCanManageConnection: true,
      ownerCanManageModel: true,
      modelSelectableByOthers: false,
    },
  };
}

function maskKey(value) {
  const key = String(value || "");
  if (!key) {
    return "";
  }
  if (key.length <= 8) {
    return `${key.slice(0, 2)}***${key.slice(-1)}`;
  }
  return `${key.slice(0, 4)}***${key.slice(-4)}`;
}

function normalizeBaseUrl(value) {
  return String(value || "")
    .trim()
    .replace(/\/+$/, "")
    .replace(/^https?:\/\//i, "");
}

function normalizeProtocol(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!allowedProtocols.has(normalized)) {
    throw new Error(`Unsupported protocol: ${value}`);
  }
  return normalized;
}

function normalizeModel(value) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    throw new Error("Model cannot be empty.");
  }
  return normalized;
}

function normalizePlatformId(value, fallback = "platform") {
  return String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || fallback;
}

function splitModels(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeModel);
  }

  return String(value || "")
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map(normalizeModel);
}

function normalizePlatform(platform = {}, index = 0, previousPlatform = null) {
  const fallbackId = normalizePlatformId(platform.name || platform.baseUrl || `platform-${index + 1}`, `platform-${index + 1}`);
  const id = normalizePlatformId(platform.id, fallbackId);
  const name = String(platform.name || previousPlatform?.name || `Platform ${index + 1}`).trim();
  const protocol = normalizeProtocol(platform.protocol || previousPlatform?.protocol || "https");
  const baseUrl = normalizeBaseUrl(platform.baseUrl || previousPlatform?.baseUrl || "");
  if (!baseUrl) {
    throw new Error(`baseUrl cannot be empty for platform: ${id}`);
  }

  const models = Array.from(
    new Set(
      splitModels(platform.models?.length ? platform.models : previousPlatform?.models || []).filter(Boolean)
    )
  );

  if (models.length === 0) {
    throw new Error(`At least one model is required for platform: ${id}`);
  }

  let apiKey = String(platform.apiKey ?? "").trim();
  if (!apiKey || apiKey.includes("***")) {
    apiKey = String(previousPlatform?.apiKey || "").trim();
  }

  return {
    id,
    name,
    protocol,
    baseUrl,
    apiKey,
    models,
  };
}

function toLegacyFields(config) {
  const activePlatform =
    config.platforms.find((item) => item.id === config.selection.platformId) || config.platforms[0] || defaultPlatform();

  return {
    server: {
      mode: "direct",
      protocol: activePlatform.protocol,
      baseUrl: activePlatform.baseUrl,
    },
    model: {
      selected: config.selection.model,
    },
    credentials: {
      apiKey: activePlatform.apiKey,
    },
  };
}

function normalizeConfig(raw, previousRaw = null) {
  const defaults = defaultConfig();
  const previous = previousRaw ? normalizeConfig(previousRaw) : null;
  const previousPlatforms = new Map((previous?.platforms || []).map((item) => [item.id, item]));

  let rawPlatforms = Array.isArray(raw?.platforms) ? raw.platforms : null;
  if (!rawPlatforms || rawPlatforms.length === 0) {
    const legacyPlatform = {
      id: "default",
      name: "Default",
      protocol: raw?.server?.protocol || defaults.platforms[0].protocol,
      baseUrl: raw?.server?.baseUrl || defaults.platforms[0].baseUrl,
      apiKey: raw?.credentials?.apiKey || defaults.platforms[0].apiKey,
      models: [raw?.model?.selected || defaults.selection.model],
    };
    rawPlatforms = [legacyPlatform];
  }

  const platforms = rawPlatforms.map((item, index) => {
    const fallbackId = normalizePlatformId(item?.id || item?.name || item?.baseUrl || `platform-${index + 1}`, `platform-${index + 1}`);
    return normalizePlatform(item, index, previousPlatforms.get(fallbackId) || null);
  });

  const selectedPlatformId = String(raw?.selection?.platformId || raw?.activePlatformId || raw?.selectedPlatformId || "").trim();
  let activePlatform = platforms.find((item) => item.id === selectedPlatformId) || platforms[0];

  const requestedModel = String(raw?.selection?.model || raw?.activeModel || raw?.model?.selected || "").trim();
  const model = activePlatform.models.includes(requestedModel) ? requestedModel : activePlatform.models[0];

  const normalized = {
    meta: {
      ...defaults.meta,
      ...(raw?.meta || {}),
    },
    auth: {
      ...defaults.auth,
      ...(raw?.auth || {}),
    },
    platforms,
    selection: {
      platformId: activePlatform.id,
      model,
    },
    permissions: {
      ...defaults.permissions,
      ...(raw?.permissions || {}),
    },
  };

  return {
    ...normalized,
    ...toLegacyFields(normalized),
  };
}

function loadConfig() {
  return normalizeConfig(readJson(localPath, readJson(templatePath, defaultConfig())) || defaultConfig());
}

function sanitizeConfig(config) {
  return {
    ...config,
    platforms: (config.platforms || []).map((platform) => ({
      ...platform,
      apiKey: maskKey(platform.apiKey),
    })),
    credentials: {
      ...(config.credentials || {}),
      apiKey: maskKey(config.credentials?.apiKey),
    },
  };
}

function inspectConfig(args) {
  const config = loadConfig();
  const showKey = String(args["show-key"] || "").trim().toLowerCase() === "true";

  printAndExit({
    ok: true,
    config: showKey
      ? config
      : sanitizeConfig(config),
    source: readJson(localPath, null) ? path.relative(process.cwd(), localPath) : path.relative(process.cwd(), templatePath),
  });
}

function setConfig(args) {
  const current = loadConfig();

  if (args.configJson !== undefined) {
    const parsed = JSON.parse(String(args.configJson || "{}"));
    const next = normalizeConfig(parsed, current);
    ensureDir(dataDir);
    writeJson(localPath, next);

    printAndExit({
      ok: true,
      action: "set",
      path: path.relative(process.cwd(), localPath),
      updated: {
        platforms: next.platforms.map((platform) => ({
          id: platform.id,
          name: platform.name,
          protocol: platform.protocol,
          baseUrl: platform.baseUrl,
          models: platform.models,
          apiKeyConfigured: Boolean(platform.apiKey),
        })),
        selection: next.selection,
      },
    });
  }

  const next = structuredClone(current);
  const activePlatform = next.platforms.find((item) => item.id === next.selection.platformId) || next.platforms[0];

  if (args.protocol !== undefined) {
    activePlatform.protocol = normalizeProtocol(args.protocol);
  }

  if (args.baseUrl !== undefined) {
    const normalizedBaseUrl = normalizeBaseUrl(args.baseUrl);
    if (!normalizedBaseUrl) {
      throw new Error("baseUrl cannot be empty.");
    }
    activePlatform.baseUrl = normalizedBaseUrl;
  }

  if (args.model !== undefined) {
    const normalizedModel = normalizeModel(args.model);
    if (!activePlatform.models.includes(normalizedModel)) {
      activePlatform.models.push(normalizedModel);
    }
    next.selection.model = normalizedModel;
  }

  if (args.apiKey !== undefined) {
    activePlatform.apiKey = String(args.apiKey || "").trim();
  }

  const normalized = normalizeConfig(next, current);
  ensureDir(dataDir);
  writeJson(localPath, normalized);

  printAndExit({
    ok: true,
    action: "set",
    path: path.relative(process.cwd(), localPath),
    updated: {
      selection: normalized.selection,
      activePlatform: normalized.platforms.find((item) => item.id === normalized.selection.platformId),
    },
  });
}

function resetConfig() {
  const config = defaultConfig();
  ensureDir(dataDir);
  writeJson(localPath, config);

  printAndExit({
    ok: true,
    action: "reset",
    path: path.relative(process.cwd(), localPath),
    config: {
      selection: config.selection,
      platforms: config.platforms,
    },
  });
}

const args = parseArgs(process.argv.slice(2));
const action = String(args.action || "inspect").trim();

try {
  if (action === "inspect") {
    inspectConfig(args);
  }

  if (action === "set") {
    setConfig(args);
  }

  if (action === "reset") {
    resetConfig();
  }

  printAndExit(
    {
      ok: false,
      error: `Unsupported action: ${action}`,
      supportedActions: ["inspect", "set", "reset"],
    },
    1
  );
} catch (error) {
  printAndExit(
    {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown runtime config error.",
    },
    1
  );
}
