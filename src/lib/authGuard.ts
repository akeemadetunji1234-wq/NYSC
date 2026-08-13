import { getServerSession } from "next-auth/next";
import { authOptions } from "../app/api/auth/[...nextauth]/route";

type GuardedUser = {
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
  const user = await requireUser();
  const roles = Array.isArray(role) ? role : [role];

  if (!roles.includes(user.role)) {
    throw new Error(`Forbidden: Requires one of roles [${roles.join(", ")}]`);
  }
  return user;
}

export async function requireOwnerOrAdmin(ownerId: string) {
  if (!ownerId || ownerId.length > 100) throw new Error("Invalid owner identifier");
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.id !== ownerId) {
    throw new Error("Forbidden: You do not have permission to modify this resource.");
  }
  return user;
}
