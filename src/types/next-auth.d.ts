import type { DefaultSession } from "next-auth";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      isBanned: boolean;
      agentVerified: boolean;
      isPremium: boolean;
      premiumPlan: string | null;
      premiumExpiry: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    isBanned?: boolean;
    agentVerified?: boolean;
    isPremium?: boolean;
    premiumPlan?: string | null;
    premiumExpiry?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    isBanned?: boolean;
    agentVerified?: boolean;
    isPremium?: boolean;
    premiumPlan?: string | null;
    premiumExpiry?: string | null;
  }
}
