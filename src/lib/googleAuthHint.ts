export const GOOGLE_ROLE_COOKIE = "nysc_google_role";

export function rememberGoogleRole(role: "CORP" | "AGENT") {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${GOOGLE_ROLE_COOKIE}=${role}; Path=/; Max-Age=180; SameSite=Lax${secure}`;
}
