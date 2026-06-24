import NextAuth from "next-auth/next";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { cookies } from "next/headers";
import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
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
        if (credentials?.email === "admin" && credentials?.password === "admin") {
          // Return a mock admin user
          return {
            id: "mock-admin-id",
            name: "System Admin",
            email: "admin@admin.com",
            role: "ADMIN"
          } as any;
        }

        if (credentials?.email && credentials?.password) {
          const user = await prisma.user.findUnique({ where: { email: credentials.email } });
          
          if (!user || !user.password) {
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
    async jwt({ token, user, account, isNewUser }) {
      // First time sign in
      if (account && user) {
        // If it's the mock admin, don't hit the database
        if (user.id === "mock-admin-id") {
          token.role = "ADMIN";
          token.sub = user.id;
          return token;
        }

        // Get the current role from DB just to be safe
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        let finalRole = dbUser?.role || "CORP";

        // If user is already an ADMIN, don't overwrite it
        if (finalRole !== "ADMIN") {
          const cookieStore = await cookies();
          const cookieRole = cookieStore.get("auth_role")?.value;
          
          if (cookieRole) {
            finalRole = cookieRole.toUpperCase() === "AGENT" ? "AGENT" : "CORP";
            await prisma.user.update({
              where: { id: user.id },
              data: { role: finalRole },
            });
          }
        }
        
        token.role = finalRole;
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.sub || token.id || (token as any).uid;
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
