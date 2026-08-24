import { getServerSession } from "next-auth/next";
import { authOptions } from "../app/api/auth/[...nextauth]/route";
import { assertRole, assertOwnerOrAdmin } from "./authorization";

export type GuardedUser = {
  id: string;
  role: string;
  email?: string | null;
  name?: string | null;
  isBanned?: boolean;
};

export async function requireUser(): Promise<GuardedUser> {
  const session = await getServerSession(authOptions);
  const user = session?.user as (Partial<GuardedUser> | undefined);
  if (!user?.id || !user.role || user.isBanned) {
    throw new Error("Unauthorized: You must be logged in to perform this action.");
  }
  return user as GuardedUser;
}

export async function requireRole(role: string | string[]) {
  return assertRole(await requireUser(), role);
}

export async function requireOwnerOrAdmin(ownerId: string) {
  return assertOwnerOrAdmin(await requireUser(), ownerId);
}
