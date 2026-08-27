export function getSessionCookieConfig(secure: boolean) {
  return {
    name: secure ? "__Secure-next-auth.session-token" : "next-auth.session-token",
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure,
      path: "/",
    },
  };
}
