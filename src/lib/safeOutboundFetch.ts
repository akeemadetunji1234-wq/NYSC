import dns from "node:dns/promises";
import net from "node:net";

export const DEFAULT_OUTBOUND_TIMEOUT_MS = 5_000;
export const DEFAULT_OUTBOUND_MAX_RESPONSE_BYTES = 1_000_000;

export type SafeOutboundFetchOptions = {
  allowedHosts?: readonly string[];
  timeoutMs?: number;
  maxResponseBytes?: number;
  maxRedirects?: number;
};

function normalizeHost(host: string) {
  return host.trim().toLowerCase().replace(/\.$/, "");
}

export function isPrivateIpAddress(address: string) {
  const normalized = address.toLowerCase().replace(/^\[|\]$/g, "");
  if (net.isIPv4(normalized)) {
    const octets = normalized.split(".").map(Number);
    const [a, b] = octets;
    return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 0 || b === 168)) || (a === 198 && (b === 18 || b === 19)) || a >= 224;
  }
  if (net.isIPv6(normalized)) {
    const compact = normalized.replace(/^::ffff:/, "");
    if (net.isIPv4(compact)) return isPrivateIpAddress(compact);
    return normalized === "::1" || normalized === "::" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb") || normalized.startsWith("ff");
  }
  return false;
}

export function validateOutboundUrl(rawUrl: string, options: Pick<SafeOutboundFetchOptions, "allowedHosts"> = {}) {
  if (typeof rawUrl !== "string" || rawUrl.length > 2048 || rawUrl.includes("\\")) {
    throw new Error("Outbound URL rejected");
  }

  let url: URL;
  try {
    // No base URL is supplied, so protocol-relative and relative inputs fail.
    url = new URL(rawUrl);
  } catch {
    throw new Error("Outbound URL rejected");
  }

  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443") || url.search.includes("\\n") || url.hash.includes("\\n")) {
    throw new Error("Outbound URL rejected");
  }

  const hostname = normalizeHost(url.hostname);
  if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local") || hostname.endsWith(".internal") || isPrivateIpAddress(hostname)) {
    throw new Error("Outbound URL rejected");
  }

  const allowedHosts = options.allowedHosts?.map(normalizeHost);
  if (allowedHosts && !allowedHosts.includes(hostname)) {
    throw new Error("Outbound URL host is not allowlisted");
  }

  url.hash = "";
  return url;
}

async function readResponseBodyWithLimit(response: Response, maxResponseBytes: number) {
  if (!response.body) {
    const body = new Uint8Array(await response.arrayBuffer());
    if (body.byteLength > maxResponseBytes) throw new Error("Outbound response is too large");
    return body;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxResponseBytes) {
        await reader.cancel();
        throw new Error("Outbound response is too large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

async function assertPublicResolution(url: URL) {
  const addresses = net.isIP(url.hostname) ? [url.hostname] : (await dns.lookup(url.hostname, { all: true, verbatim: true })).map((entry) => entry.address);
  if (!addresses.length || addresses.some(isPrivateIpAddress)) throw new Error("Outbound URL resolves to a private address");
}

export async function safeOutboundFetch(input: string | URL, init: RequestInit = {}, options: SafeOutboundFetchOptions = {}) {
  const timeoutMs = Math.max(100, Math.min(options.timeoutMs ?? DEFAULT_OUTBOUND_TIMEOUT_MS, 30_000));
  const maxResponseBytes = Math.max(1, Math.min(options.maxResponseBytes ?? DEFAULT_OUTBOUND_MAX_RESPONSE_BYTES, 10_000_000));
  const maxRedirects = Math.max(0, Math.min(options.maxRedirects ?? 0, 3));
  let currentUrl = validateOutboundUrl(String(input), options);

  for (let redirectCount = 0; ; redirectCount += 1) {
    await assertPublicResolution(currentUrl);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const signals = [controller.signal, init.signal].filter((signal): signal is AbortSignal => Boolean(signal));
    const signal = signals.length === 1 ? signals[0] : AbortSignal.any(signals);
    let response: Response;
    try {
      response = await fetch(currentUrl, { ...init, redirect: "manual", signal });
    } finally {
      clearTimeout(timeout);
    }

    if (response.status >= 300 && response.status < 400) {
      if (redirectCount >= maxRedirects || !response.headers.get("location")) throw new Error("Outbound redirect rejected");
      if (init.method && !["GET", "HEAD"].includes(init.method.toUpperCase())) throw new Error("Outbound redirect rejected");
      currentUrl = validateOutboundUrl(new URL(response.headers.get("location")!, currentUrl).toString(), options);
      continue;
    }

    const declaredLength = Number(response.headers.get("content-length") || 0);
    if (declaredLength > maxResponseBytes) throw new Error("Outbound response is too large");
    const body = await readResponseBodyWithLimit(response, maxResponseBytes);
    return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });
  }
}
