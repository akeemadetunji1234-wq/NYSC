const ALLOWED_CALLBACK_PREFIXES = ["/", "/member", "/agent", "/control-room-7f3k9d", "/verify-google"] as const;

export function isAllowedCallbackPath(pathname: string) {
  if (!pathname || pathname.includes("\\") || pathname.includes("//")) return false;
  return ALLOWED_CALLBACK_PREFIXES.some((prefix) =>
    prefix === "/" ? pathname === "/" : pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function sameOriginTarget(url: string, baseUrl: string) {
  const trimmed = url.trim();
  if (!trimmed || trimmed.includes("\\") || trimmed.includes("\0")) return null;
  const base = new URL(baseUrl);
  const target = new URL(trimmed, base);
  if (target.protocol !== "http:" && target.protocol !== "https:") return null;
  if (target.origin !== base.origin || !isAllowedCallbackPath(target.pathname)) return null;
  if (target.username || target.password) return null;
  return target;
}

/** Allow relative and same-origin absolute callbacks. Reject external, protocol-relative, and non-http URLs. */
export function resolveSafeCallbackUrl(url: string, baseUrl: string) {
  try {
    const target = sameOriginTarget(url, baseUrl);
    return target ? target.toString() : baseUrl;
  } catch {
    return baseUrl;
  }
}

/** Return only a same-origin path for browser navigation; reject external and encoded bypass paths. */
export function resolveSafeCallbackPath(url: string | null | undefined, origin: string) {
  if (!url) return null;
  try {
    const target = sameOriginTarget(url, origin);
    if (!target) return null;
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return null;
  }
}
