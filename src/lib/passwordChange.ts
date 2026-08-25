import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "./prisma.ts";
import { writeSecurityEvent } from "./securityEvents.ts";

const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: z.string().min(12).max(128),
    confirmPassword: z.string().min(12).max(128),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must differ from the current password",
    path: ["newPassword"],
  });

export async function changePasswordForUser(userId: string, input: unknown) {
  const parsed = passwordChangeSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid password details");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, password: true, role: true },
  });

  if (!user?.password || !(await bcrypt.compare(parsed.data.currentPassword, user.password))) {
    throw new Error("Current password is incorrect");
  }

  const password = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        password,
        sessionVersion: { increment: 1 },
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
    await tx.session.deleteMany({ where: { userId } });
  });

  await writeSecurityEvent(
    "AUTH_PASSWORD_CHANGED",
    user.email || userId,
    `Password changed for ${user.role}; active sessions revoked`,
  );

  return { success: true } as const;
}

export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
