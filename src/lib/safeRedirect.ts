const ALLOWED_CALLBACK_PREFIXES = ["/", "/member", "/agent", "/control-room-7f3k9d", "/verify-google"] as const;

export function isAllowedCallbackPath(pathname: string) {
  if (!pathname || pathname.includes("\\") || pathname.includes("//")) return false;
  return ALLOWED_CALLBACK_PREFIXES.some((prefix) =>
    prefix === "/" ? pathname === "/" : pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function rejectUnsafeRawUrl(url: string) {
  const trimmed = url.trim();
  // Protocol-relative and absolute external URLs must not pass as "paths"
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed) || trimmed.startsWith("//")) return true;
  return false;
}

export function resolveSafeCallbackUrl(url: string, baseUrl: string) {
  try {
    if (rejectUnsafeRawUrl(url)) return baseUrl;
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
    if (rejectUnsafeRawUrl(url)) return null;
    const base = new URL(origin);
    const target = new URL(url, base);
    if (target.origin !== base.origin || !isAllowedCallbackPath(target.pathname)) return null;
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return null;
  }
}
