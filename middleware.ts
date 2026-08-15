import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

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

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const secret = process.env.NEXTAUTH_SECRET;

  // Production must provide NEXTAUTH_SECRET. Treat an absent secret as unauthenticated
  // rather than allowing a protected document shell to render.
  if (!secret) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    url.search = `?callbackUrl=${encodeURIComponent(`${pathname}${search}`)}`;
    return NextResponse.redirect(url);
  }

  let token: SessionToken | null = null;
  try {
    token = (await getToken({ req: request, secret })) as SessionToken | null;
  } catch {
    token = null;
  }

  if (!token?.sub || !token.role || token.isBanned) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    url.search = `?callbackUrl=${encodeURIComponent(`${pathname}${search}`)}`;
    return NextResponse.redirect(url);
  }

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

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/agent/:path*", "/member/:path*"],
};

export default middleware;
