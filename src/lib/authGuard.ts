import { getServerSession } from "next-auth/next";
import { authOptions } from "../app/api/auth/[...nextauth]/route";
import { assertRole, assertOwnerOrAdmin } from "./authorization";
import { hasRecentAdminStepUp } from "./adminMfa";
import { prisma } from "./prisma";

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

/**
 * Admin + recent MFA step-up (15 minutes).
 * Soft rollout: if MFA is not enrolled yet, access is allowed so the sole admin is not locked out.
 * After MFA is enabled, step-up is mandatory.
 */
export async function requireAdminStepUp() {
  const admin = await requireRole("ADMIN");
  const row = await prisma.user.findUnique({
    where: { id: admin.id },
    select: { totpEnabled: true },
  });
  if (row?.totpEnabled) {
    const ok = await hasRecentAdminStepUp(admin.id);
    if (!ok) {
      throw new Error(
        "MFA_STEP_UP_REQUIRED: Re-verify with your authenticator app before this action.",
      );
    }
  }
  return admin;
}
