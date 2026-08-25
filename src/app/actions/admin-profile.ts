"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "../../lib/prisma";
import { requireRole } from "../../lib/authGuard";
import { writeAuditLog } from "../../lib/audit";

const profileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
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
