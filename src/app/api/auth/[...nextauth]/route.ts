import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcryptjs";
import { rateLimit } from "../../../../lib/rateLimit";
import { writeSecurityEvent } from "../../../../lib/securityEvents";
import { internalDelay, loginDeviceSignal, loginFailureDelayMs, resolveSafeCallbackUrl, SESSION_MAX_AGE_SECONDS, shouldRejectSessionToken } from "../../../../lib/authSecurity";
import { createGoogleOnboardingState } from "../../../../lib/emailVerification";
import { getSessionCookieConfig } from "../../../../lib/authCookiePolicy";

const isProductionBuild = process.env.NEXT_PHASE === "phase-production-build";
const DUMMY_PASSWORD_HASH = "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";
const configuredNextAuthSecret = process.env.NEXTAUTH_SECRET;
const nextAuthSecret = configuredNextAuthSecret || (isProductionBuild ? "production-build-fallback-secret-key-32-chars-minimum!!" : "");
if (!isProductionBuild && process.env.NODE_ENV === "production" && nextAuthSecret.length < 32) {
  throw new Error("NEXTAUTH_SECRET must be configured with at least 32 characters in production.");
}

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials, request) {
      const email = typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
      const password = typeof credentials?.password === "string" ? credentials.password : "";
      if (!email || email.length > 254 || !password || password.length > 128) return null;

      const forwardedFor = request.headers?.["x-forwarded-for"];
      const realIp = request.headers?.["x-real-ip"];
      const ip = String(forwardedFor || realIp || "unknown").split(",")[0].trim().slice(0, 100);
      const userAgent = typeof request.headers?.["user-agent"] === "string" ? request.headers["user-agent"] : "unknown";
      const deviceSignal = loginDeviceSignal(ip, userAgent);
      const [emailLimit, ipLimit, deviceLimit] = await Promise.all([
        rateLimit(`login:email:${email}`, 10, 15 * 60 * 1000),
        rateLimit(`login:ip:${ip}`, 30, 15 * 60 * 1000),
        rateLimit(`login:device:${deviceSignal}`, 20, 15 * 60 * 60 * 1000),
      ]);
      if (!emailLimit.success || !ipLimit.success || !deviceLimit.success) return null;

      const user = await prisma.user.findUnique({ where: { email } });
      const isPasswordValid = await bcrypt.compare(password, user?.password || DUMMY_PASSWORD_HASH);
      if (user?.lockedUntil && user.lockedUntil > new Date()) {
        await writeSecurityEvent("AUTH_LOGIN_LOCKED", email, "Login rejected for locked account");
        return null;
      }
      if (!user || !user.password || user.isBanned || !isPasswordValid) {
        const failedAttempts = user && user.password && !user.isBanned ? user.failedLoginAttempts : 0;
        await internalDelay(loginFailureDelayMs(failedAttempts));
        if (user && user.password && !user.isBanned && !isPasswordValid) {
          const nextAttempts = user.failedLoginAttempts + 1;
          const shouldLock = nextAttempts >= 5;
          await prisma.user.updateMany({
            where: { id: user.id, failedLoginAttempts: user.failedLoginAttempts },
            data: {
              failedLoginAttempts: shouldLock ? 0 : { increment: 1 },
              lockedUntil: shouldLock ? new Date(Date.now() + 15 * 60 * 1000) : null,
            },
          });
          await writeSecurityEvent(shouldLock ? "AUTH_ACCOUNT_LOCKED" : "AUTH_LOGIN_FAILED", email, shouldLock ? "Account locked after repeated failed logins" : "Invalid credentials");
        } else {
          await writeSecurityEvent("AUTH_LOGIN_REJECTED", email, "Invalid credentials or unavailable account");
        }
        return null;
      }
      await prisma.user.updateMany({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockedUntil: null } });
      return {

        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.unshift(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      checks: ["pkce", "state"],
    }),
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  callbacks: {
    async redirect({ url, baseUrl }) {
      return resolveSafeCallbackUrl(url, baseUrl);
    },
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;

        const email = user.email.trim().toLowerCase();
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
          if (existingUser.isBanned) return false;
          user.id = existingUser.id;
          return true;
        }

        const onboardingState = createGoogleOnboardingState();
        await prisma.googleOnboardingState.deleteMany({ where: { email } });
        await prisma.googleOnboardingState.create({
          data: {
            tokenHash: onboardingState.tokenHash,
            email,
            name: user.name?.trim().slice(0, 120) || null,
            expiresAt: onboardingState.expiresAt,
          },
        });
        return `/verify-google?state=${encodeURIComponent(onboardingState.rawToken)}`;
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (account && user?.id) {
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (!dbUser || dbUser.isBanned) {
          token.isBanned = true;
          return token;
        }

        token.role = dbUser.role;
        token.sub = dbUser.id;
        token.isBanned = false;
        token.sessionVersion = dbUser.sessionVersion;
        token.agentVerified = dbUser.agentVerified;
        token.isPremium = dbUser.isPremium;
        token.premiumPlan = dbUser.premiumPlan;
        token.premiumExpiry = dbUser.premiumExpiry?.toISOString() ?? null;
        return token;
      }

      if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { isPremium: true, premiumPlan: true, premiumExpiry: true, role: true, isBanned: true, agentVerified: true, sessionVersion: true },
        });
        if (!dbUser || dbUser.isBanned) {
          token.isBanned = true;
          return token;
        }
        if (token.sessionVersion !== undefined && token.sessionVersion !== dbUser.sessionVersion) {
          token.invalidated = true;
          return token;
        }
        token.isBanned = false;
        token.sessionVersion = dbUser.sessionVersion;
        token.agentVerified = dbUser.agentVerified;
        token.isPremium = dbUser.isPremium;
        token.premiumPlan = dbUser.premiumPlan;
        token.premiumExpiry = dbUser.premiumExpiry?.toISOString() ?? null;
        token.role = dbUser.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (shouldRejectSessionToken(token) || !session.user) return null;
      session.user.id = token.sub;
      session.user.role = token.role;
      session.user.isBanned = false;
      session.user.agentVerified = token.agentVerified ?? false;
      session.user.isPremium = token.isPremium ?? false;
      session.user.premiumPlan = token.premiumPlan ?? null;
      session.user.premiumExpiry = token.premiumExpiry ?? null;
      return session;
    },
  },
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
    updateAge: 60 * 60,
  },
  jwt: {
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  useSecureCookies: process.env.NODE_ENV === "production" || process.env.VERCEL === "1",
  cookies: {
    sessionToken: getSessionCookieConfig(process.env.NODE_ENV === "production" || process.env.VERCEL === "1"),
  },
  secret: nextAuthSecret,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
