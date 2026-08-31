const ALLOWED_CALLBACK_PREFIXES = ["/", "/member", "/agent", "/admin"] as const;

export function isAllowedCallbackPath(pathname: string) {
  return ALLOWED_CALLBACK_PREFIXES.some((prefix) =>
    prefix === "/" ? pathname === "/" : pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function resolveSafeCallbackUrl(url: string, baseUrl: string) {
  try {
    const base = new URL(baseUrl);
    const target = new URL(url, base);
    if (target.origin !== base.origin || !isAllowedCallbackPath(target.pathname)) return baseUrl;
    return target.toString();
  } catch {
    return baseUrl;
  }
}

/** Return only a same-origin path for browser navigation; reject external and encoded bypass paths. */
export function resolveSafeCallbackPath(url: string | null | undefined, origin: string) {
  if (!url) return null;
  try {
    const base = new URL(origin);
    const target = new URL(url, base);
    if (target.origin !== base.origin || !isAllowedCallbackPath(target.pathname)) return null;
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return null;
  }
}
