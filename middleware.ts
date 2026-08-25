import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { getClientIp, rateLimit } from "./src/lib/rateLimit";
import { requestSizeLimit, sameOriginAllowed } from "./src/lib/security";

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

function signInRedirect(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/signin";
  url.search = `?callbackUrl=${encodeURIComponent(`${request.nextUrl.pathname}${request.nextUrl.search}`)}`;
  return NextResponse.redirect(url);
}

function securityResponse(message: string, status: 403 | 413 | 429, retryAfterSeconds?: number) {
  const headers = new Headers({ "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  if (retryAfterSeconds) headers.set("Retry-After", String(retryAfterSeconds));
  return NextResponse.json({ error: message }, { status, headers });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApiRequest = pathname.startsWith("/api/");
  const isAuthRequest = pathname.startsWith("/api/auth/");
  const isStateChanging = ["POST", "PUT", "PATCH", "DELETE"].includes(request.method);

  if (isApiRequest) {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > requestSizeLimit(pathname)) {
      return securityResponse("Request payload is too large.", 413);
    }

    if (isStateChanging && !sameOriginAllowed(request)) {
      return securityResponse("Cross-origin request rejected.", 403);
    }

    if (isAuthRequest) {
      const ip = getClientIp(request);
      const routeLimit = await rateLimit(`edge-auth:route:${pathname}:ip:${ip}`, 20, 15 * 60 * 1000);
      const aggregateLimit = await rateLimit(`edge-auth:all:ip:${ip}`, 60, 15 * 60 * 1000);
      if (!routeLimit.success || !aggregateLimit.success) {
        return securityResponse(
          "Too many authentication requests. Please try again later.",
          429,
          Math.max(routeLimit.retryAfterSeconds, aggregateLimit.retryAfterSeconds),
        );
      }
    }
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (pathname.startsWith("/admin") || pathname.startsWith("/agent") || pathname.startsWith("/member")) {
    // Protected document routes fail closed when the signing secret is absent.
    if (!secret) return signInRedirect(request);

    let token: SessionToken | null = null;
    try {
      token = (await getToken({ req: request, secret })) as SessionToken | null;
    } catch {
      token = null;
    }

    if (!token?.sub || !token.role || token.isBanned) return signInRedirect(request);

    const requiredRole = pathname.startsWith("/admin")
      ? "ADMIN"
      : pathname.startsWith("/agent")
        ? "AGENT"
        : "CORP";

    if (token.role !== requiredRole) {
      const url = request.nextUrl.clone();
      url.pathname = destinationForRole(token.role);
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/admin/:path*", "/agent/:path*", "/member/:path*"],
};

export default middleware;
