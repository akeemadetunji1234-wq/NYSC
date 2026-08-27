export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
const ALLOWED_CALLBACK_PREFIXES = ["/", "/member", "/agent", "/admin"];

export function isAllowedCallbackPath(pathname: string) {
  return ALLOWED_CALLBACK_PREFIXES.some((prefix) => prefix === "/" ? pathname === "/" : pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function shouldRejectSessionToken(token: { invalidated?: boolean; isBanned?: boolean; sub?: string; role?: string }) {
  return Boolean(token.invalidated || token.isBanned || !token.sub || !token.role);
}

export function resolveSafeCallbackUrl(url: string, baseUrl: string) {
  try {
    const target = new URL(url, baseUrl);
    if (target.origin !== new URL(baseUrl).origin || !isAllowedCallbackPath(target.pathname)) return baseUrl;
    return target.toString();
  } catch {
    return baseUrl;
  }
}
