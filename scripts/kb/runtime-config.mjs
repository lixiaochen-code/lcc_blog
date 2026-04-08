import path from "node:path";
import { dataDir, ensureDir, parseArgs, readJson, writeJson } from "./shared.mjs";

const templatePath = path.join(dataDir, "ai-runtime.example.json");
const localPath = path.join(dataDir, "ai-runtime.local.json");
const allowedProtocols = new Set(["http", "https"]);

function printAndExit(payload, code = 0) {
  console.log(`${JSON.stringify(payload, null, 2)}\n`);
  process.exit(code);
}

function defaultConfig() {
  return {
    meta: {
      version: 1,
      ownerManaged: true,
      singleModelOnly: true,
      dockerRequired: false,
      description: "Runtime settings for the production AI tool. Intended to run directly on a server process without Docker.",
    },
    server: {
      mode: "direct",
      protocol: "https",
      baseUrl: "api.openai.com/v1",
    },
    auth: {
      provider: "owner-managed",
      inviteOnly: true,
    },
    model: {
      selected: "gpt-4.1-mini",
    },
    credentials: {
      apiKey: "",
    },
    permissions: {
      ownerCanManageConnection: true,
      ownerCanManageModel: true,
      modelSelectableByOthers: false,
    },
  };
}

function loadConfig() {
  return readJson(localPath, readJson(templatePath, defaultConfig())) || defaultConfig();
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

function inspectConfig(args) {
  const config = loadConfig();
  const showKey = String(args["show-key"] || "").trim().toLowerCase() === "true";

  printAndExit({
    ok: true,
    config: {
      ...config,
      credentials: {
        ...config.credentials,
        apiKey: showKey ? String(config.credentials?.apiKey || "") : maskKey(config.credentials?.apiKey),
      },
    },
    source: readJson(localPath, null) ? path.relative(process.cwd(), localPath) : path.relative(process.cwd(), templatePath),
  });
}

function setConfig(args) {
  const current = loadConfig();
  const next = structuredClone(current);

  if (args.protocol !== undefined) {
    next.server.protocol = normalizeProtocol(args.protocol);
  }

  if (args.baseUrl !== undefined) {
    const normalizedBaseUrl = normalizeBaseUrl(args.baseUrl);
    if (!normalizedBaseUrl) {
      throw new Error("baseUrl cannot be empty.");
    }
    next.server.baseUrl = normalizedBaseUrl;
  }

  if (args.model !== undefined) {
    next.model.selected = normalizeModel(args.model);
  }

  if (args.apiKey !== undefined) {
    next.credentials.apiKey = String(args.apiKey || "").trim();
  }

  ensureDir(dataDir);
  writeJson(localPath, next);

  printAndExit({
    ok: true,
    action: "set",
    path: path.relative(process.cwd(), localPath),
    updated: {
      protocol: next.server.protocol,
      baseUrl: next.server.baseUrl,
      model: next.model.selected,
      apiKeyConfigured: Boolean(next.credentials.apiKey),
    },
    rules: {
      ownerManaged: Boolean(next.meta?.ownerManaged),
      singleModelOnly: Boolean(next.meta?.singleModelOnly),
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
      protocol: config.server.protocol,
      baseUrl: config.server.baseUrl,
      model: config.model.selected,
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
