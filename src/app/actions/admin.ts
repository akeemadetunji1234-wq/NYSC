"use server";

import { requireRole } from "../../lib/authGuard";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { createNotification } from "../../lib/notificationService";
import { writeAuditLog } from "../../lib/audit";
import { getPremiumExpiry } from "../../lib/premiumPlans";
import { isPaystackConfigured } from "../../lib/paystack";
import { isEmailConfigured } from "../../lib/email";

const userIdSchema = z.string().trim().min(1).max(100);

export async function getDashboardStats() {
  await requireRole("ADMIN");
  const users = await prisma.user.count();
  const agents = await prisma.user.count({ where: { role: "AGENT" } });
  const pendingAgents = await prisma.user.count({ where: { role: "AGENT", agentVerified: false } });
  const properties = await prisma.property.count();
  const activeBookings = await prisma.booking.count({ where: { status: { in: ["PENDING", "ACCEPTED"] } } });

  return {
    users,
    agents,
    pendingAgents,
    properties,
    activeBookings
  };
}

export async function getOperationalDiagnostics() {
  await requireRole("ADMIN");
  const startedAt = Date.now();
  let database: { status: "ok" | "error"; latencyMs: number; error?: string };
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = { status: "ok", latencyMs: Date.now() - startedAt };
  } catch (error) {
    console.error("Admin diagnostics database check failed:", error);
    database = { status: "error", latencyMs: Date.now() - startedAt, error: "Database check failed" };
  }

  const [paymentCounts, recentAuditCount] = await Promise.all([
    prisma.premiumPayment.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.auditLog.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    database,
    providers: {
      paystack: { configured: isPaystackConfigured(), webhookPath: "/api/payments/paystack/webhook" },
      email: { configured: isEmailConfigured },
    },
    scheduledJobs: { cronSecretConfigured: Boolean(process.env.CRON_SECRET?.trim()) },
    payments: Object.fromEntries(paymentCounts.map((entry) => [entry.status, entry._count._all])),
    auditEventsLast24Hours: recentAuditCount,
  };
}

export async function getAgents() {
  await requireRole("ADMIN");
  const agents = await prisma.user.findMany({
    where: { role: "AGENT" },
    orderBy: { agentVerified: "asc" }, // Pending first
    select: {
      id: true, name: true, email: true, phone: true, image: true,
      role: true, agentVerified: true, agentVerifiedAt: true, agentRejected: true, rejectionReason: true,
      verificationStatus: true, verificationNotes: true,
      agency: true, experience: true, operatingStates: true, bio: true,
      docType: true, docNumber: true, docUrl: true,
      isBanned: true, createdAt: true,
      _count: { select: { properties: true } },
    }
  });

  return agents;
}

export async function getUnverifiedAgents() {
  await requireRole("ADMIN");
  const agents = await prisma.user.findMany({
    where: { role: "AGENT", agentVerified: false },
    select: {
      id: true, name: true, email: true, phone: true, image: true,
      role: true, agentVerified: true, agentVerifiedAt: true, agentRejected: true, rejectionReason: true,
      verificationStatus: true, verificationNotes: true,
      agency: true, experience: true, operatingStates: true, bio: true,
      docType: true, docNumber: true, docUrl: true,
      createdAt: true,
    },
  });
  return agents.map(({ docUrl, ...agent }) => ({ ...agent, documentAvailable: Boolean(docUrl) }));
}

export async function verifyAgent(agentId: string, verify: boolean = true) {
  await requireRole("ADMIN");
  await prisma.user.update({
    where: { id: agentId },
    data: {
      agentVerified: verify,
      agentVerifiedAt: verify ? new Date() : null,
      verificationStatus: verify ? "VERIFIED" : "UNVERIFIED",
      isBanned: verify ? false : undefined,
      verificationNotes: null,
      agentRejected: false,
      rejectionReason: null,
    }
  });

  await writeAuditLog(
    verify ? "AGENT_VERIFIED" : "AGENT_UNVERIFIED",
    agentId,
    verify ? "Agent verification approved" : "Agent verification revoked",
  );

  if (verify) {
    await createNotification(
      agentId,
      "AGENT_VERIFIED",
      "Account Verified",
      "Your agent account has been verified. You can now publish properties.",
      "/agent"
    );
  }

  revalidatePath("/admin/agents");
}

export async function activateAgent(agentId: string) {
  const admin = await requireRole("ADMIN");
  const safeAgentId = userIdSchema.parse(agentId);
  const agent = await prisma.user.findUnique({ where: { id: safeAgentId }, select: { id: true, role: true } });
  if (!agent || agent.role !== "AGENT") throw new Error("Agent not found");

  await prisma.user.update({
    where: { id: safeAgentId },
    data: {
      isBanned: false,
      agentVerified: true,
      agentVerifiedAt: new Date(),
      verificationStatus: "VERIFIED",
      verificationNotes: null,
      agentRejected: false,
      rejectionReason: null,
    },
  });
  await writeAuditLog("AGENT_ACTIVATED", safeAgentId, `Agent activated by administrator ${admin.id}`);
  await createNotification(
    safeAgentId,
    "AGENT_VERIFIED",
    "Agent account activated",
    "Your agent account is active and you can now publish property listings.",
    "/agent",
  );
  revalidatePath("/admin/agents");
  revalidatePath("/agent/properties");
  revalidatePath("/agent/verification");
}

export async function deactivateAgent(agentId: string) {
  const admin = await requireRole("ADMIN");
  const safeAgentId = userIdSchema.parse(agentId);
  const agent = await prisma.user.findUnique({ where: { id: safeAgentId }, select: { id: true, role: true } });
  if (!agent || agent.role !== "AGENT") throw new Error("Agent not found");

  await prisma.user.update({
    where: { id: safeAgentId },
    data: {
      isBanned: false,
      agentVerified: false,
      agentVerifiedAt: null,
      verificationStatus: "DEACTIVATED",
      verificationNotes: "Agent account deactivated by an administrator.",
      agentRejected: false,
      rejectionReason: null,
    },
  });
  await writeAuditLog("AGENT_DEACTIVATED", safeAgentId, `Agent deactivated by administrator ${admin.id}; listing creation disabled`);
  await createNotification(
    safeAgentId,
    "AGENT_VERIFIED",
    "Agent account deactivated",
    "Your agent account has been deactivated. You cannot publish or update property listings until an administrator activates it again.",
    "/agent/verification",
  );
  revalidatePath("/admin/agents");
  revalidatePath("/agent/properties");
  revalidatePath("/agent/verification");
}

export async function rejectAgent(agentId: string, reason?: string) {
  await requireRole("ADMIN");
  await prisma.user.update({
    where: { id: agentId },
    data: {
      agentVerified: false,
      agentVerifiedAt: null,
      verificationStatus: "REJECTED",
      verificationNotes: reason || "Your application did not meet our guidelines.",
      agentRejected: true,
      rejectionReason: reason || "Your application did not meet our guidelines.",
    }
  });

  await writeAuditLog("AGENT_REJECTED", agentId, reason || "Agent application rejected");

  await createNotification(
    agentId,
    "AGENT_VERIFIED", // Using same enum but with failure message
    "Application Rejected",
    reason || "Your agent application was reviewed and rejected. Please contact support.",
    "/agent"
  );

  revalidatePath("/admin/agents");
}

export async function getAllUsers() {
  await requireRole("ADMIN");
  const users = await prisma.user.findMany({
    orderBy: { email: "asc" },
    select: {
      id: true, name: true, email: true, phone: true, whatsapp: true, image: true,
      role: true, agentVerified: true, agentVerifiedAt: true, agentRejected: true, rejectionReason: true,
      isBanned: true, isPremium: true, premiumPlan: true, premiumExpiry: true, createdAt: true,
    },
  });
  return users;
}

export async function getCorpMembers() {
  await requireRole("ADMIN");
  const users = await prisma.user.findMany({
    where: { role: "CORP" },
    orderBy: { email: "asc" },
    select: {
      id: true, name: true, email: true, phone: true, whatsapp: true, image: true,
      role: true, batch: true, ppaState: true, ppaLga: true, isBanned: true,
      isPremium: true, premiumPlan: true, premiumExpiry: true, createdAt: true,
    },
  });
  return users;
}


export async function getPremiumPayments() {
  await requireRole("ADMIN");
  const payments = await prisma.premiumPayment.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      reference: true,
      provider: true,
      plan: true,
      amount: true,
      currency: true,
      status: true,
      authorizationUrl: true,
      paidAt: true,
      failureReason: true,
      createdAt: true,
      updatedAt: true,
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  return payments.map((payment) => ({
    id: payment.id,
    reference: payment.reference,
    provider: payment.provider,
    plan: payment.plan,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    authorizationUrl: payment.authorizationUrl,
    paidAt: payment.paidAt?.toISOString() || null,
    failureReason: payment.failureReason,
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
    user: payment.user,
  }));
}

export async function getPayouts() {
  await requireRole("ADMIN");
  const bookings = await prisma.booking.findMany({
    where: { feeStatus: "PAID" },
    select: {
      id: true,
      amount: true,
      status: true,
      feeStatus: true,
      createdAt: true,
      property: {
        select: {
          title: true,
          agent: { select: { id: true, name: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return bookings.map((booking) => ({
    id: booking.id,
    property: booking.property?.title || "Unknown property",
    agent: booking.property?.agent?.name || booking.property?.agent?.email || "Unknown agent",
    amount: booking.amount,
    date: booking.createdAt.toISOString(),
    bookingStatus: booking.status,
    feeStatus: booking.feeStatus,
  }));
}

export async function updateUserRole(userId: string, newRole: "ADMIN" | "AGENT" | "CORP") {
  const admin = await requireRole("ADMIN");
  const safeUserId = userIdSchema.parse(userId);
  if (! ["ADMIN", "AGENT", "CORP"].includes(newRole)) throw new Error("Invalid role");
  if (admin.id === safeUserId && newRole !== "ADMIN") throw new Error("You cannot remove your own admin access");
  await prisma.user.update({
    where: { id: safeUserId },
    data: { role: newRole }
  });
  await writeAuditLog("USER_ROLE_CHANGED", safeUserId, `Role changed to ${newRole}`);
  revalidatePath("/admin/users");
}

export async function toggleUserBan(userId: string, isBanned: boolean) {
  const admin = await requireRole("ADMIN");
  const safeUserId = userIdSchema.parse(userId);
  if (typeof isBanned !== "boolean") throw new Error("Invalid ban state");
  if (admin.id === safeUserId && isBanned) throw new Error("You cannot ban your own admin account");
  await prisma.user.update({
    where: { id: safeUserId },
    data: { isBanned }
  });
  await writeAuditLog(isBanned ? "USER_BANNED" : "USER_UNBANNED", safeUserId, isBanned ? "Account banned" : "Account unbanned");
  revalidatePath("/admin/users");
}

export async function deleteUserAccount(userId: string) {
  const admin = await requireRole("ADMIN");
  const safeUserId = userIdSchema.parse(userId);
  if (admin.id === safeUserId) throw new Error("You cannot delete your own admin account");
  await prisma.user.delete({
    where: { id: safeUserId }
  });
  await writeAuditLog("USER_DELETED", safeUserId, "User account deleted by administrator");
  revalidatePath("/admin/users");
}

export async function upgradeToPremium(userId: string, plan: "CORP_PREMIUM" | "AGENT_PREMIUM") {
  await requireRole("ADMIN");
  const safeUserId = userIdSchema.parse(userId);
  if (!["CORP_PREMIUM", "AGENT_PREMIUM"].includes(plan)) throw new Error("Invalid premium plan");
  const now = new Date();
  const expiry = getPremiumExpiry(now);

  await prisma.user.update({
      where: { id: safeUserId },
      data: {
        isPremium: true,
      premiumPlan: plan,
      premiumSince: now,
      premiumExpiry: expiry,
    }
  });
  await writeAuditLog("PREMIUM_GRANTED", safeUserId, `Premium plan granted: ${plan}`);
  revalidatePath("/admin/users");
}

export async function revokePremium(userId: string) {
  await requireRole("ADMIN");
  const safeUserId = userIdSchema.parse(userId);
  await prisma.user.update({
    where: { id: safeUserId },
    data: {
      isPremium: false,
      premiumPlan: null,
      premiumExpiry: null,
    }
  });
  await writeAuditLog("PREMIUM_REVOKED", safeUserId, "Premium access revoked by administrator");
  revalidatePath("/admin/users");
}

export async function getAdminAnalytics(periodDays: number = 30) {
  await requireRole("ADMIN");
  const safePeriodDays = [7, 30, 90].includes(periodDays) ? periodDays : 30;
  const periodStartDate = new Date(Date.now() - safePeriodDays * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    listedProperties,
    activeBookings,
    revenue30d,
    revenue7d,
    revenuePrev7d,
    recentActivity,
    weeklyRevenue,
    weeklyListings,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.property.count({ where: { status: "PUBLISHED" } }),
    prisma.booking.count({ where: { status: { in: ["PENDING", "ACCEPTED"] } } }),
    prisma.booking.aggregate({
      where: { createdAt: { gte: periodStartDate }, feeStatus: "PAID" },
      _sum: { amount: true },
    }),
    prisma.booking.aggregate({
      where: { createdAt: { gte: sevenDaysAgo }, feeStatus: "PAID" },
      _sum: { amount: true },
    }),
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
    // Weekly external-payment reference buckets (simplified for charts)
    prisma.booking.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: sevenDaysAgo }, feeStatus: "PAID" },
      _sum: { amount: true },
    }),
    // Weekly listings vs bookings
    prisma.property.count({ where: { createdAt: { gte: periodStartDate } } }),
  ]);

  const rev7 = revenue7d._sum.amount ?? 0;
  const revPrev7 = revenuePrev7d._sum.amount ?? 0;
  const revenueTrend = revPrev7 > 0 ? ((rev7 - revPrev7) / revPrev7) * 100 : 0;

  // Generate daily external-payment reference data for the last 7 days
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dailyRevenue = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
    const dayName = days[date.getDay()];
    const amount = weeklyRevenue.find(b => 
      new Date(b.createdAt).toDateString() === date.toDateString()
    )?._sum.amount ?? 0;
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
    where: {
      role: "CORP",
      NOT: { ppaLga: null }
    },
    select: { ppaLga: true, ppaState: true }
  });

  const demandMap: Record<string, { count: number; state: string }> = {};
  corpMembers.forEach(c => {
    if (!c.ppaLga) return;
    const key = `${c.ppaLga}, ${c.ppaState || "Lagos"}`;
    if (!demandMap[key]) {
      demandMap[key] = { count: 0, state: c.ppaState || "Lagos" };
    }
    demandMap[key].count++;
  });

  const properties = await prisma.property.findMany({
    where: { status: "PUBLISHED" },
    select: { lga: true, state: true }
  });

  const supplyMap: Record<string, number> = {};
  properties.forEach(p => {
    if (!p.lga) return;
    const key = `${p.lga}, ${p.state}`;
    supplyMap[key] = (supplyMap[key] || 0) + 1;
  });

  const allKeys = Array.from(new Set([...Object.keys(demandMap), ...Object.keys(supplyMap)]));
  
  const heatmap = allKeys.map(key => {
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

    return {
      lga,
      state,
      demand,
      supply,
      ratio,
      status
    };
  });

  return heatmap.sort((a, b) => b.ratio - a.ratio);
}

// ─── Artisan Management ────────────────────────────────────────────────────────

export async function getArtisans() {
  await requireRole("ADMIN");
  const artisans = await prisma.artisan.findMany({
    orderBy: { createdAt: "desc" }
  });
  return artisans;
}

export async function createArtisan(data: {
  name: string;
  trade: string;
  state: string;
  lga: string;
  phone: string;
  rating?: number;
  verified?: boolean;
}) {
  await requireRole("ADMIN");
  const newArtisan = await prisma.artisan.create({
      data: {
        ...data,
        rating: data.rating ?? 5.0,
        verified: data.verified ?? false
      }
    });
  await writeAuditLog("ARTISAN_CREATED", newArtisan.id, `Artisan created: ${newArtisan.name}`);
  revalidatePath("/admin/artisans");
  revalidatePath("/member/artisans");
  return newArtisan;
}

export async function updateArtisan(id: string, data: {
  name?: string;
  trade?: string;
  state?: string;
  lga?: string;
  phone?: string;
  rating?: number;
  verified?: boolean;
}) {
  await requireRole("ADMIN");
  const updated = await prisma.artisan.update({
    where: { id },
    data
  });
  await writeAuditLog("ARTISAN_UPDATED", id, "Artisan details updated");
  revalidatePath("/admin/artisans");
  revalidatePath("/member/artisans");
  return updated;
}

export async function deleteArtisan(id: string) {
  await requireRole("ADMIN");
  await prisma.artisan.delete({
    where: { id }
  });
  await writeAuditLog("ARTISAN_DELETED", id, "Artisan deleted");
  revalidatePath("/admin/artisans");
  revalidatePath("/member/artisans");
}

export async function verifyArtisan(id: string, verified: boolean) {
  await requireRole("ADMIN");
  await prisma.artisan.update({
    where: { id },
    data: { verified }
  });
  await writeAuditLog(verified ? "ARTISAN_VERIFIED" : "ARTISAN_UNVERIFIED", id, `Artisan verification set to ${verified}`);
  revalidatePath("/admin/artisans");
  revalidatePath("/member/artisans");
}

export async function getPendingProperties() {
  await requireRole("ADMIN");
  const properties = await prisma.property.findMany({
    where: { status: "PENDING" },
    include: { agent: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" }
  });
  return properties.map(p => ({
    id: p.id,
    title: p.title,
    hostName: p.agent?.name || p.agent?.email || "Unknown Agent",
    location: `${p.lga || ''} ${p.state || ''}`.trim() || p.location,
    pricePerNight: `₦${p.price.toLocaleString()}`,
    submittedAt: new Date(p.createdAt).toLocaleDateString(),
    bedrooms: p.bedrooms,
    status: p.status.toLowerCase()
  }));
}

export async function updatePropertyStatus(id: string, status: "PUBLISHED" | "REJECTED") {
  await requireRole("ADMIN");
  await prisma.property.update({
    where: { id },
    data: { status }
  });
  await writeAuditLog("PROPERTY_STATUS_CHANGED", id, `Listing status changed to ${status}`);
  revalidatePath("/admin/backlog");
}

export async function getPartners() {
  await requireRole("ADMIN");
  return await prisma.partner.findMany({
    orderBy: { joinedAt: "desc" }
  });
}
