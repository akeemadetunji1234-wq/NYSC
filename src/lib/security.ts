const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export const AUTH_REQUEST_MAX_BYTES = 64 * 1024;
export const API_REQUEST_MAX_BYTES = 1024 * 1024;
export const UPLOAD_REQUEST_MAX_BYTES = 6 * 1024 * 1024;
export const CLOUDINARY_UPLOAD_REQUEST_MAX_BYTES = 11 * 1024 * 1024;

// No route currently requires third-party browser access. A route must be
// explicitly added here before CORS headers can be emitted for it.
const PUBLIC_CORS_ROUTES = new Set<string>();

function normalizeOrigin(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol === "http:" && !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) return null;
    if (!( ["http:", "https:"].includes(url.protocol)) || url.username || url.password || url.pathname !== "/" && url.pathname !== "") return null;
    return url.origin;
  } catch {
    return null;
  }
}

function configuredCorsOrigins() {
  return new Set(
    (process.env.CORS_ALLOWED_ORIGINS || "")
      .split(",")
      .map((origin) => normalizeOrigin(origin.trim()))
      .filter((origin): origin is string => Boolean(origin)),
  );
}

export function corsPolicy(request: Request, pathname = new URL(request.url).pathname) {
  const requestOrigin = normalizeOrigin(new URL(request.url).origin);
  const originHeader = request.headers.get("origin");
  if (!originHeader) return { allowed: true, crossOrigin: false, origin: null };

  const origin = normalizeOrigin(originHeader);
  if (!requestOrigin || !origin) return { allowed: false, crossOrigin: true, origin: null };
  if (origin === requestOrigin) return { allowed: true, crossOrigin: false, origin };

  const allowed = PUBLIC_CORS_ROUTES.has(pathname) && configuredCorsOrigins().has(origin);
  return { allowed, crossOrigin: true, origin: allowed ? origin : null };
}

export function corsResponseHeaders(request: Request, pathname = new URL(request.url).pathname) {
  const policy = corsPolicy(request, pathname);
  if (!policy.allowed || !policy.crossOrigin || !policy.origin) return undefined;
  return new Headers({
    "Access-Control-Allow-Origin": policy.origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  });
}

export function sanitizeText(value: string, maxLength: number) {
  return value
    .normalize("NFKC")
    .replace(CONTROL_CHARACTERS, "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, maxLength);
}

export function sameOriginAllowed(request: Request) {
  return corsPolicy(request).allowed;
}

export function requestSizeLimit(pathname: string) {
  if (pathname === "/api/upload") return UPLOAD_REQUEST_MAX_BYTES;
  if (pathname.startsWith("/api/upload/cloudinary")) return CLOUDINARY_UPLOAD_REQUEST_MAX_BYTES;
  if (pathname.startsWith("/api/auth/")) return AUTH_REQUEST_MAX_BYTES;
  return API_REQUEST_MAX_BYTES;
}
