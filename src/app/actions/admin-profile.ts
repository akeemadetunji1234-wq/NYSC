"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "../../lib/prisma";
import { requireRole } from "../../lib/authGuard";
import { writeAuditLog } from "../../lib/audit";

const profileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(12).max(128),
  confirmPassword: z.string().min(12).max(128),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords do not match",
  path: ["confirmPassword"],
});

export async function getAdminProfile() {
  const admin = await requireRole("ADMIN");
  return prisma.user.findUniqueOrThrow({
    where: { id: admin.id },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
}

export async function updateAdminProfile(input: unknown) {
  const admin = await requireRole("ADMIN");
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid profile details");

  const existing = await prisma.user.findFirst({
    where: { email: parsed.data.email, NOT: { id: admin.id } },
    select: { id: true },
  });
  if (existing) throw new Error("Email is already in use");

  const updated = await prisma.user.update({
    where: { id: admin.id },
    data: parsed.data,
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  await writeAuditLog("ADMIN_PROFILE_UPDATED", admin.id, "Administrator profile updated");
  revalidatePath("/admin/profile");
  return updated;
}

export async function changeAdminPassword(input: unknown) {
  const admin = await requireRole("ADMIN");
  const parsed = passwordSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || "Invalid password details");

  const user = await prisma.user.findUnique({ where: { id: admin.id }, select: { password: true } });
  if (!user?.password || !(await bcrypt.compare(parsed.data.currentPassword, user.password))) {
    throw new Error("Current password is incorrect");
  }

  const password = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: admin.id }, data: { password, sessionVersion: { increment: 1 }, failedLoginAttempts: 0, lockedUntil: null } });
    await tx.session.deleteMany({ where: { userId: admin.id } });
  });
  await writeAuditLog("ADMIN_PASSWORD_CHANGED", admin.id, "Administrator password changed and active sessions revoked");
  return { success: true };
}
