const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export const AUTH_REQUEST_MAX_BYTES = 64 * 1024;
export const API_REQUEST_MAX_BYTES = 1024 * 1024;
export const UPLOAD_REQUEST_MAX_BYTES = 6 * 1024 * 1024;
export const CLOUDINARY_UPLOAD_REQUEST_MAX_BYTES = 11 * 1024 * 1024;

export function sanitizeText(value: string, maxLength: number) {
  return value
    .normalize("NFKC")
    .replace(CONTROL_CHARACTERS, "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, maxLength);
}

export function sameOriginAllowed(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  let requestOrigin: string;
  try {
    requestOrigin = new URL(request.url).origin;
  } catch {
    return false;
  }

  const configuredOrigins = [
    requestOrigin,
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, ""),
  ].filter((value): value is string => Boolean(value));

  return configuredOrigins.includes(origin);
}

export function requestSizeLimit(pathname: string) {
  if (pathname === "/api/upload") return UPLOAD_REQUEST_MAX_BYTES;
  if (pathname.startsWith("/api/upload/cloudinary")) return CLOUDINARY_UPLOAD_REQUEST_MAX_BYTES;
  if (pathname.startsWith("/api/auth/")) return AUTH_REQUEST_MAX_BYTES;
  return API_REQUEST_MAX_BYTES;
}
