import { getServerSession } from "next-auth/next";
import { authOptions } from "../app/api/auth/[...nextauth]/route";

export async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("Unauthorized: You must be logged in to perform this action.");
  }
  return session.user as any;
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
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.id !== ownerId) {
    throw new Error("Forbidden: You do not have permission to modify this resource.");
  }
  return user;
}
