import fs from "node:fs";
import path from "node:path";

export function normalizeProxyUrl(value: string | undefined) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }
  if (/^https?:\/\//i.test(raw) || /^socks5?:\/\//i.test(raw)) {
    return raw;
  }
  return `http://${raw}`;
}

function readDotEnvValue() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    return "";
  }

  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const normalized = trimmed.startsWith("export ") ? trimmed.slice(7).trim() : trimmed;
    const equalIndex = normalized.indexOf("=");
    if (equalIndex === -1) {
      continue;
    }
    const key = normalized.slice(0, equalIndex).trim();
    if (!["proxy_url", "PROXY_URL", "AI_URL_PROXY"].includes(key)) {
      continue;
    }
    const value = normalized.slice(equalIndex + 1).trim().replace(/^['"]|['"]$/g, "");
    if (value) {
      return value;
    }
  }
  return "";
}

export function getProxyUrl() {
  return normalizeProxyUrl(process.env.proxy_url || process.env.PROXY_URL || process.env.AI_URL_PROXY || readDotEnvValue());
}

export function getProxyEnv() {
  const proxyUrl = getProxyUrl();
  if (!proxyUrl) {
    return {};
  }

  return {
    AI_URL_PROXY: proxyUrl,
    HTTP_PROXY: proxyUrl,
    HTTPS_PROXY: proxyUrl,
    ALL_PROXY: proxyUrl,
    http_proxy: proxyUrl,
    https_proxy: proxyUrl,
    all_proxy: proxyUrl,
  };
}
