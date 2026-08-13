import NextAuth from "next-auth/next";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        name: { label: "Name", type: "text" },
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (credentials?.email && credentials?.password) {
          const user = await prisma.user.findUnique({ where: { email: credentials.email } });
          
          if (!user || !user.password || user.isBanned) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            return null;
          }
          
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          } as any;
        }

        return null;
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;
        
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email }
        });

        if (existingUser) {
          if (existingUser.isBanned) return false;
          user.id = existingUser.id;
          return true;
        } else {
          // New User - Redirect to verify-google for OTP
          return `/verify-google?email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.name || '')}`;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // On first sign in, set up the token
      if (account && user) {
        // Authorization state always comes from the database, never from a browser cookie.
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (!dbUser || dbUser.isBanned) {
          token.isBanned = true;
          return token;
        }

        token.role = dbUser.role;
        token.sub = user.id;
        token.isBanned = false;
        token.isPremium = dbUser.isPremium ?? false;
        token.premiumPlan = dbUser?.premiumPlan ?? null;
        token.premiumExpiry = dbUser?.premiumExpiry?.toISOString() ?? null;
        return token;
      }

      // On every subsequent request — refresh isPremium from DB so admin upgrades reflect immediately
      if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { isPremium: true, premiumPlan: true, premiumExpiry: true, role: true, isBanned: true },
        });
        if (dbUser) {
          token.isBanned = dbUser.isBanned;
          token.isPremium = dbUser.isPremium;
          token.premiumPlan = dbUser.premiumPlan;
          token.premiumExpiry = dbUser.premiumExpiry?.toISOString() ?? null;
          token.role = dbUser.role;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token.isBanned) return null as any;
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).isBanned = false;
        (session.user as any).id = token.sub || token.id || (token as any).uid;
        (session.user as any).isPremium = token.isPremium ?? false;
        (session.user as any).premiumPlan = token.premiumPlan ?? null;
        (session.user as any).premiumExpiry = token.premiumExpiry ?? null;
      }
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
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
