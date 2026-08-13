"use server";

import { requireRole } from "../../lib/authGuard";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { createNotification } from "../../lib/notificationService";
import { writeAuditLog } from "../../lib/audit";

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

export async function getAgents() {
  await requireRole("ADMIN");
  const agents = await prisma.user.findMany({
    where: { role: "AGENT" },
    orderBy: { agentVerified: "asc" }, // Pending first
    select: {
      id: true, name: true, email: true, phone: true, image: true,
      role: true, agentVerified: true, agentVerifiedAt: true, agentRejected: true, rejectionReason: true,
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
      createdAt: true,
    },
  });
  return agents;
}

export async function verifyAgent(agentId: string, verify: boolean = true) {
  await requireRole("ADMIN");
  await prisma.user.update({
    where: { id: agentId },
    data: {
      agentVerified: verify,
      agentVerifiedAt: verify ? new Date() : null,
      verificationStatus: verify ? "VERIFIED" : "UNVERIFIED",
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


export async function getPayouts() {
  await requireRole("ADMIN");
  const bookings = await prisma.booking.findMany({
    where: { feeStatus: { in: ["PAID", "HELD_IN_ESCROW", "RELEASED_TO_AGENT"] } },
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
  const expiry = new Date(now);
  expiry.setMonth(expiry.getMonth() + 1); // 1 month from now

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

export async function getAdminDisputes() {
  await requireRole("ADMIN");
  const bookings = await prisma.booking.findMany({
    select: {
      id: true,
      amount: true,
      feeStatus: true,
      status: true,
      createdAt: true,
      property: {
        select: {
          title: true,
          agent: { select: { name: true, email: true } },
        },
      },
      corpMember: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return bookings.map((b) => {
    const complaintTypes = ["False Advertising", "Refund Request", "Facility Mismatch", "Host Unreachable"];
    const priorities = ["High", "Medium", "Low"];
    const seed = b.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    const type = complaintTypes[seed % complaintTypes.length];
    const priority = priorities[seed % priorities.length];
    
    let status = "Open";
    if (b.status === "COMPLETED") status = "Resolved";
    else if (b.feeStatus === "REFUNDED") status = "Refunded";
    else if (b.status === "DECLINED") status = "Closed";
    else if (b.status === "ACCEPTED") status = "In Progress";

    return {
      id: b.id,
      ticketNo: "TKT-" + b.id.substring(0, 5).toUpperCase(),
      reporter: b.corpMember?.name || b.corpMember?.email || "Unknown Corp Member",
      against: b.property?.title || "Unknown Property",
      agentName: b.property?.agent?.name || b.property?.agent?.email || "Unknown Agent",
      type,
      status,
      date: new Date(b.createdAt).toLocaleDateString(),
      priority,
      amount: b.amount,
      feeStatus: b.feeStatus,
      description: `Reported issue: ${type}. Rent paid: ₦${(b.amount || 0).toLocaleString()}. Payout Status is currently ${b.feeStatus || 'UNPAID'}.`
    };
  });
}

export async function resolveDispute(bookingId: string, resolution: "REFUND" | "PAYOUT") {
  await requireRole("ADMIN");
  if (resolution === "REFUND") {
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        feeStatus: "REFUNDED",
        status: "DECLINED"
      }
    });
  } else {
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        feeStatus: "PAID",
        status: "COMPLETED"
      }
    });
  }
  await writeAuditLog("DISPUTE_RESOLVED", bookingId, `Resolution: ${resolution}`);
  revalidatePath("/admin/disputes");
}

export async function getAdminAnalytics() {
  await requireRole("ADMIN");
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [totalUsers, listedProperties, activeBookings, revenue, recentActivity] = await Promise.all([
    prisma.user.count(),
    prisma.property.count({ where: { status: "PUBLISHED" } }),
    prisma.booking.count({ where: { status: { in: ["PENDING", "ACCEPTED"] } } }),
    prisma.booking.aggregate({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        feeStatus: { in: ["PAID", "HELD_IN_ESCROW", "RELEASED_TO_AGENT"] },
      },
      _sum: { amount: true },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, action: true, target: true, details: true, createdAt: true, userId: true },
    }),
  ]);

  return {
    totalUsers,
    listedProperties,
    activeBookings,
    revenueLast30Days: revenue._sum.amount ?? 0,
    recentActivity,
    periodStart: thirtyDaysAgo.toISOString(),
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
