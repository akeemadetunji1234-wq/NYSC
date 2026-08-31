import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getClientIp, rateLimit } from "./src/lib/rateLimit";
import { corsPolicy, corsResponseHeaders, requestSizeLimit } from "./src/lib/security";

type SessionToken = {
  sub?: string;
  role?: "ADMIN" | "AGENT" | "CORP";
  isBanned?: boolean;
};

function destinationForRole(role: SessionToken["role"]): "/admin" | "/agent" | "/member" {
  if (role === "ADMIN") return "/admin";
  if (role === "AGENT") return "/agent";
  return "/member";
}

function createSecurityContext(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID()).replace(/=/g, "");
  const contentSecurityPolicy = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self' https://accounts.google.com",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://api.mapbox.com https://*.mapbox.com https://accounts.google.com https://www.gstatic.com https://js.pusher.com`,
    `style-src 'self' 'nonce-${nonce}' https://api.mapbox.com https://*.mapbox.com`,
    "img-src 'self' data: blob: https://*.mapbox.com https://images.unsplash.com https://www.svgrepo.com https://i.pravatar.cc https://*.googleusercontent.com https://res.cloudinary.com",
    "font-src 'self' data:",
    "connect-src 'self' https://api.mapbox.com https://*.mapbox.com https://events.mapbox.com https://accounts.google.com https://www.googleapis.com https://*.pusher.com https://*.pusherapp.com wss://*.pusher.com wss://*.pusherapp.com https://api.cloudinary.com",
    "frame-src 'self' https://accounts.google.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);
  return { requestHeaders, contentSecurityPolicy };
}

function withSecurityHeaders(response: NextResponse, contentSecurityPolicy: string) {
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Cache-Control", response.headers.get("Cache-Control") || "no-store");
  return response;
}

function signInRedirect(request: NextRequest, contentSecurityPolicy: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/signin";
  url.search = `?callbackUrl=${encodeURIComponent(`${request.nextUrl.pathname}${request.nextUrl.search}`)}`;
  return withSecurityHeaders(NextResponse.redirect(url), contentSecurityPolicy);
}

function securityResponse(message: string, status: 403 | 413 | 429, contentSecurityPolicy: string, retryAfterSeconds?: number) {
  const headers = new Headers({ "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  if (retryAfterSeconds) headers.set("Retry-After", String(retryAfterSeconds));
  const response = NextResponse.json({ error: message }, { status, headers });
  return withSecurityHeaders(response, contentSecurityPolicy);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { requestHeaders, contentSecurityPolicy } = createSecurityContext(request);
  const isApiRequest = pathname.startsWith("/api/");
  const isAuthRequest = pathname.startsWith("/api/auth/");
  if (isApiRequest) {
    const cors = corsPolicy(request, pathname);
    if (!cors.allowed) {
      return securityResponse("Cross-origin request rejected.", 403, contentSecurityPolicy);
    }

    if (request.method === "OPTIONS") {
      const headers = corsResponseHeaders(request, pathname);
      if (!headers) return securityResponse("Cross-origin request rejected.", 403, contentSecurityPolicy);
      return withSecurityHeaders(new NextResponse(null, { status: 204, headers }), contentSecurityPolicy);
    }

    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > requestSizeLimit(pathname)) {
      return securityResponse("Request payload is too large.", 413, contentSecurityPolicy);
    }

    if (isAuthRequest) {
      const ip = getClientIp(request);
      const routeLimit = await rateLimit(`edge-auth:route:${pathname}:ip:${ip}`, 20, 15 * 60 * 1000);
      const aggregateLimit = await rateLimit(`edge-auth:all:ip:${ip}`, 60, 15 * 60 * 1000);
      if (!routeLimit.success || !aggregateLimit.success) {
        return securityResponse(
          "Too many authentication requests. Please try again later.",
          429,
          contentSecurityPolicy,
          Math.max(routeLimit.retryAfterSeconds, aggregateLimit.retryAfterSeconds),
        );
      }
    }
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (pathname.startsWith("/admin") || pathname.startsWith("/agent") || pathname.startsWith("/member")) {
    if (!secret) return signInRedirect(request, contentSecurityPolicy);

    let token: SessionToken | null = null;
    try {
      const secureCookie = process.env.NODE_ENV === "production" || request.nextUrl.protocol === "https:" || process.env.VERCEL === "1";
      token = (await getToken({ req: request, secret, secureCookie })) as SessionToken | null;
    } catch {
      token = null;
    }

    if (!token?.sub || !token.role || token.isBanned) return signInRedirect(request, contentSecurityPolicy);

    const requiredRole = pathname.startsWith("/admin")
      ? "ADMIN"
      : pathname.startsWith("/agent")
        ? "AGENT"
        : "CORP";

    if (token.role !== requiredRole) {
      const url = request.nextUrl.clone();
      url.pathname = destinationForRole(token.role);
      url.search = "";
      return withSecurityHeaders(NextResponse.redirect(url), contentSecurityPolicy);
    }
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  const corsHeaders = corsResponseHeaders(request, pathname);
  corsHeaders?.forEach((value, key) => response.headers.set(key, value));
  return withSecurityHeaders(response, contentSecurityPolicy);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export default middleware;
