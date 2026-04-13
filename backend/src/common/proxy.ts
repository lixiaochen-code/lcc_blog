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

export function getProxyUrl() {
  return normalizeProxyUrl(process.env.AI_URL_PROXY);
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
