"use server";

import { prisma } from "../../lib/prisma";

export async function getUserRoleByEmail(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { role: true }
    });
    return user?.role || null;
  } catch (error) {
    console.error("Error checking user role:", error);
    return null;
  }
}
