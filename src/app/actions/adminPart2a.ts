"use server";

import { requireRole, requireAdminStepUp } from "../../lib/authGuard";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "../../lib/audit";
import { getPremiumExpiry } from "../../lib/premiumPlans";

const userIdSchema = z.string().trim().min(1).max(100);

export async function updateUserRole(userId: string, newRole: "ADMIN" | "AGENT" | "CORP") {
  const admin = await requireAdminStepUp();
  const safeUserId = userIdSchema.parse(userId);
  if (!["ADMIN", "AGENT", "CORP"].includes(newRole)) throw new Error("Invalid role");
  if (admin.id === safeUserId && newRole !== "ADMIN") throw new Error("You cannot remove your own admin access");
  await prisma.user.update({
    where: { id: safeUserId },
    data: { role: newRole },
  });
  await writeAuditLog("USER_ROLE_CHANGED", safeUserId, `Role changed to ${newRole}`);
  revalidatePath("/control-room-7f3k9d/users");
}

export async function toggleUserBan(userId: string, isBanned: boolean) {
  const admin = await requireAdminStepUp();
  const safeUserId = userIdSchema.parse(userId);
  if (typeof isBanned !== "boolean") throw new Error("Invalid ban state");
  if (admin.id === safeUserId && isBanned) throw new Error("You cannot ban your own admin account");
  await prisma.user.update({
    where: { id: safeUserId },
    data: { isBanned },
  });
  await writeAuditLog(isBanned ? "USER_BANNED" : "USER_UNBANNED", safeUserId, isBanned ? "Account banned" : "Account unbanned");
  revalidatePath("/control-room-7f3k9d/users");
}

export async function deleteUserAccount(userId: string) {
  const admin = await requireAdminStepUp();
  const safeUserId = userIdSchema.parse(userId);
  if (admin.id === safeUserId) throw new Error("You cannot delete your own admin account");
  await prisma.user.delete({ where: { id: safeUserId } });
  await writeAuditLog("USER_DELETED", safeUserId, "User account deleted by administrator");
  revalidatePath("/control-room-7f3k9d/users");
}

export async function upgradeToPremium(userId: string, plan: "CORP_PREMIUM" | "AGENT_PREMIUM") {
  await requireAdminStepUp();
  const safeUserId = userIdSchema.parse(userId);
  if (!["CORP_PREMIUM", "AGENT_PREMIUM"].includes(plan)) throw new Error("Invalid premium plan");
  const now = new Date();
  const expiry = getPremiumExpiry(now);
  await prisma.user.update({
    where: { id: safeUserId },
    data: { isPremium: true, premiumPlan: plan, premiumSince: now, premiumExpiry: expiry },
  });
  await writeAuditLog("PREMIUM_GRANTED", safeUserId, `Premium plan granted: ${plan}`);
  revalidatePath("/control-room-7f3k9d/users");
}

export async function revokePremium(userId: string) {
  await requireAdminStepUp();
  const safeUserId = userIdSchema.parse(userId);
  await prisma.user.update({
    where: { id: safeUserId },
    data: { isPremium: false, premiumPlan: null, premiumExpiry: null },
  });
  await writeAuditLog("PREMIUM_REVOKED", safeUserId, "Premium access revoked by administrator");
  revalidatePath("/control-room-7f3k9d/users");
}

export async function getAdminAnalytics(periodDays: number = 30) {
  await requireRole("ADMIN");
  const safePeriodDays = [7, 30, 90].includes(periodDays) ? periodDays : 30;
  const periodStartDate = new Date(Date.now() - safePeriodDays * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [totalUsers, listedProperties, activeBookings, revenue30d, revenue7d, revenuePrev7d, recentActivity, weeklyRevenue] =
    await Promise.all([
      prisma.user.count(),
      prisma.property.count({ where: { status: "PUBLISHED" } }),
      prisma.booking.count({ where: { status: { in: ["PENDING", "ACCEPTED"] } } }),
      prisma.booking.aggregate({ where: { createdAt: { gte: periodStartDate }, feeStatus: "PAID" }, _sum: { amount: true } }),
      prisma.booking.aggregate({ where: { createdAt: { gte: sevenDaysAgo }, feeStatus: "PAID" }, _sum: { amount: true } }),
      prisma.booking.aggregate({
        where: {
          createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), lt: sevenDaysAgo },
          feeStatus: "PAID",
        },
        _sum: { amount: true },
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, action: true, target: true, details: true, createdAt: true, userId: true },
      }),
      prisma.booking.groupBy({
        by: ["createdAt"],
        where: { createdAt: { gte: sevenDaysAgo }, feeStatus: "PAID" },
        _sum: { amount: true },
      }),
    ]);

  const rev7 = revenue7d._sum.amount ?? 0;
  const revPrev7 = revenuePrev7d._sum.amount ?? 0;
  const revenueTrend = revPrev7 > 0 ? ((rev7 - revPrev7) / revPrev7) * 100 : 0;
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dailyRevenue = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
    const dayName = days[date.getDay()];
    const amount =
      weeklyRevenue.find((b) => new Date(b.createdAt).toDateString() === date.toDateString())?._sum.amount ?? 0;
    return { name: dayName, revenue: amount };
  });

  const [verifiedAgents, pendingVerifications] = await Promise.all([
    prisma.user.count({ where: { role: "AGENT", verificationStatus: "VERIFIED" } }),
    prisma.user.count({ where: { role: "AGENT", verificationStatus: "PENDING" } }),
  ]);
  const totalAgentApps = verifiedAgents + pendingVerifications;
  const verificationHealth = totalAgentApps > 0 ? Math.round((verifiedAgents / totalAgentApps) * 100) : 100;

  return {
    totalUsers,
    listedProperties,
    activeBookings,
    revenueLast30Days: revenue30d._sum.amount ?? 0,
    weeklyRevenue: rev7,
    revenueTrend: revenueTrend.toFixed(1),
    revenueData: dailyRevenue,
    verifiedAgents,
    verificationHealth,
    recentActivity,
    periodStart: periodStartDate.toISOString(),
    periodDays: safePeriodDays,
  };
}

export async function getRegionalHeatmapData() {
  await requireRole("ADMIN");
  const corpMembers = await prisma.user.findMany({
    where: { role: "CORP", NOT: { ppaLga: null } },
    select: { ppaLga: true, ppaState: true },
  });
  const demandMap: Record<string, { count: number; state: string }> = {};
  corpMembers.forEach((c) => {
    if (!c.ppaLga) return;
    const key = `${c.ppaLga}, ${c.ppaState || "Lagos"}`;
    if (!demandMap[key]) demandMap[key] = { count: 0, state: c.ppaState || "Lagos" };
    demandMap[key].count++;
  });
  const properties = await prisma.property.findMany({
    where: { status: "PUBLISHED" },
    select: { lga: true, state: true },
  });
  const supplyMap: Record<string, number> = {};
  properties.forEach((p) => {
    if (!p.lga) return;
    const key = `${p.lga}, ${p.state}`;
    supplyMap[key] = (supplyMap[key] || 0) + 1;
  });
  const allKeys = Array.from(new Set([...Object.keys(demandMap), ...Object.keys(supplyMap)]));
  const heatmap = allKeys.map((key) => {
    const parts = key.split(", ");
    const lga = parts[0] || "Central";
    const state = parts[1] || "Lagos";
    const demand = demandMap[key]?.count || 0;
    const supply = supplyMap[key] || 0;
    const ratio = Number((demand / (supply || 1)).toFixed(1));
    let status = "Balanced";
    if (ratio >= 2.5) status = "Critical Shortage";
    else if (ratio >= 1.5) status = "Undersupplied";
    else if (ratio <= 0.8) status = "Oversupplied";
    return { lga, state, demand, supply, ratio, status };
  });
  return heatmap.sort((a, b) => b.ratio - a.ratio);
}
