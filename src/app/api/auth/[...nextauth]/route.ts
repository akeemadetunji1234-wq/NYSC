import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcryptjs";
import { rateLimit } from "../../../../lib/rateLimit";

const isProductionBuild = process.env.NEXT_PHASE === "phase-production-build";
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
    async authorize(credentials) {
      const email = typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
      const password = typeof credentials?.password === "string" ? credentials.password : "";
      if (!email || email.length > 254 || !password || password.length > 128) return null;

      const limit = rateLimit(`login:email:${email}`, 10, 15 * 60 * 1000);
      if (!limit.success) return null;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.password || user.isBanned) return null;

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) return null;

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
    }),
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  callbacks: {
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

        return `/verify-google?email=${encodeURIComponent(email)}&name=${encodeURIComponent(user.name || "")}`;
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
        token.agentVerified = dbUser.agentVerified;
        token.isPremium = dbUser.isPremium;
        token.premiumPlan = dbUser.premiumPlan;
        token.premiumExpiry = dbUser.premiumExpiry?.toISOString() ?? null;
        return token;
      }

      if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { isPremium: true, premiumPlan: true, premiumExpiry: true, role: true, isBanned: true, agentVerified: true },
        });
        if (!dbUser || dbUser.isBanned) {
          token.isBanned = true;
          return token;
        }
        token.isBanned = false;
        token.agentVerified = dbUser.agentVerified;
        token.isPremium = dbUser.isPremium;
        token.premiumPlan = dbUser.premiumPlan;
        token.premiumExpiry = dbUser.premiumExpiry?.toISOString() ?? null;
        token.role = dbUser.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (token.isBanned || !token.sub || !token.role || !session.user) return null;
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
  },
  secret: nextAuthSecret,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
