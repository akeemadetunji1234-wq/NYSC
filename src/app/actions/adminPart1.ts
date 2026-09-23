"use server";

import { requireRole, requireAdminStepUp } from "../../lib/authGuard";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { createNotification } from "../../lib/notificationService";
import { writeAuditLog } from "../../lib/audit";
import { getPremiumExpiry } from "../../lib/premiumPlans";
import { isPaystackConfigured } from "../../lib/paystack";
import { isEmailConfigured } from "../../lib/email";
import { isPusherConfigured } from "../../lib/pusher";
import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";

const userIdSchema = z.string().trim().min(1).max(100);

const artisanFieldsSchema = z.object({
  name: z.string().trim().min(1).max(120),
  trade: z.string().trim().min(1).max(80),
  state: z.string().trim().min(1).max(80),
  lga: z.string().trim().min(1).max(80),
  phone: z.string().trim().min(1).max(40),
  rating: z.number().finite().min(0).max(5).optional(),
  verified: z.boolean().optional(),
}).strict();

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

  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [paymentCounts, recentAuditCount, realtimeCounts, emailCounts] = await Promise.all([
    prisma.premiumPayment.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.auditLog.count({ where: { createdAt: { gte: last24Hours } } }),
    prisma.notification.groupBy({ where: { createdAt: { gte: last24Hours } }, by: ["deliveryStatus"], _count: { _all: true } }),
    Promise.all([
      prisma.notification.count({ where: { createdAt: { gte: last24Hours }, emailDeliveredAt: { not: null } } }),
      prisma.notification.count({ where: { createdAt: { gte: last24Hours }, emailDeliveryAttempts: { gt: 0 }, emailDeliveredAt: null, lastEmailError: { not: null } } }),
      prisma.notification.count({ where: { createdAt: { gte: last24Hours }, emailDeliveryAttempts: { gt: 0 }, emailDeliveredAt: null, lastEmailError: null } }),
    ]),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    database,
    providers: {
      paystack: { configured: isPaystackConfigured(), webhookPath: "/api/payments/paystack/webhook" },
      email: { configured: isEmailConfigured },
      pusher: { configured: isPusherConfigured },
      mapbox: { configured: Boolean(process.env.MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN) },
      distributedRateLimiting: { configured: Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) },
      whatsappReminders: { configured: Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_TEMPLATE_NAME) },
    },
    scheduledJobs: { cronSecretConfigured: Boolean(process.env.CRON_SECRET?.trim()) },
    payments: Object.fromEntries(paymentCounts.map((entry) => [entry.status, entry._count._all])),
    notifications: {
      realtime: Object.fromEntries(realtimeCounts.map((entry) => [entry.deliveryStatus, entry._count._all])),
      email: { sent: emailCounts[0], failed: emailCounts[1], pending: emailCounts[2] },
    },
    auditEventsLast24Hours: recentAuditCount,
  };
}

export async function getAdminNotificationReport(input?: unknown) {
  await requireRole("ADMIN");
  const parsed = z.object({
    deliveryStatus: z.enum(["ALL", "PENDING", "SENT", "FAILED"]).default("ALL"),
    emailStatus: z.enum(["ALL", "PENDING", "SENT", "FAILED"]).default("ALL"),
    type: z.string().trim().max(80).optional(),
  }).safeParse(input || {});
  if (!parsed.success) throw new Error("Invalid notification report filters");

  const filters = parsed.data;
  const baseWhere: Prisma.NotificationWhereInput = {
    createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    ...(filters.deliveryStatus !== "ALL" ? { deliveryStatus: filters.deliveryStatus } : {}),
    ...(filters.type ? { type: filters.type as Prisma.NotificationWhereInput["type"] } : {}),
  };
  const where: Prisma.NotificationWhereInput = {
    ...baseWhere,
    ...(filters.emailStatus === "SENT" ? { emailDeliveredAt: { not: null } } : {}),
    ...(filters.emailStatus === "FAILED" ? { emailDeliveryAttempts: { gt: 0 }, emailDeliveredAt: null, lastEmailError: { not: null } } : {}),
    ...(filters.emailStatus === "PENDING" ? { emailDeliveryAttempts: { gt: 0 }, emailDeliveredAt: null, lastEmailError: null } : {}),
  };

  const [notifications, total, realtimePending, realtimeSent, realtimeFailed, emailPending, emailSent, emailFailed] = await Promise.all([
    prisma.notification.findMany({
      where,
      take: 100,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        link: true,
        deliveryStatus: true,
        deliveryAttempts: true,
        lastDeliveryError: true,
        deliveredAt: true,
        emailDeliveryAttempts: true,
        emailDeliveredAt: true,
        lastEmailError: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { ...baseWhere, deliveryStatus: "PENDING" } }),
    prisma.notification.count({ where: { ...baseWhere, deliveryStatus: "SENT" } }),
    prisma.notification.count({ where: { ...baseWhere, deliveryStatus: "FAILED" } }),
    prisma.notification.count({ where: { ...baseWhere, emailDeliveryAttempts: { gt: 0 }, emailDeliveredAt: null, lastEmailError: null } }),
    prisma.notification.count({ where: { ...baseWhere, emailDeliveredAt: { not: null } } }),
    prisma.notification.count({ where: { ...baseWhere, emailDeliveryAttempts: { gt: 0 }, emailDeliveredAt: null, lastEmailError: { not: null } } }),
  ]);

  const maskEmail = (email: string | null) => {
    if (!email) return null;
    const [localPart, domain] = email.split("@");
    if (!domain) return "hidden";
    const visibleLocal = localPart.length <= 2 ? `${localPart.slice(0, 1)}*` : `${localPart.slice(0, 2)}***`;
    return `${visibleLocal}@${domain}`;
  };
  const safeError = (error: string | null) => error ? error.slice(0, 240) : null;

  return {
    generatedAt: new Date().toISOString(),
    windowDays: 30,
    filters,
    summary: {
      total,
      realtime: { pending: realtimePending, sent: realtimeSent, failed: realtimeFailed },
      email: { pending: emailPending, sent: emailSent, failed: emailFailed },
    },
    notifications: notifications.map((notification) => ({
      ...notification,
      lastEmailError: safeError(notification.lastEmailError),
      lastDeliveryError: safeError(notification.lastDeliveryError),
      user: { id: notification.user.id, name: notification.user.name, email: maskEmail(notification.user.email) },
    })),
  };
}

export async function getAgents() {
  await requireRole("ADMIN");
  const agents = await prisma.user.findMany({
    where: { role: "AGENT" },
    orderBy: { agentVerified: "asc" },
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
  await requireAdminStepUp();
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

  revalidatePath("/control-room-7f3k9d/agents");
}

export async function activateAgent(agentId: string) {
  const admin = await requireAdminStepUp();
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
  revalidatePath("/control-room-7f3k9d/agents");
  revalidatePath("/agent/properties");
  revalidatePath("/agent/verification");
}

export async function deactivateAgent(agentId: string) {
  const admin = await requireAdminStepUp();
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
  revalidatePath("/control-room-7f3k9d/agents");
  revalidatePath("/agent/properties");
  revalidatePath("/agent/verification");
}

export async function rejectAgent(agentId: string, reason?: string) {
  await requireAdminStepUp();
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
    "AGENT_VERIFIED",
    "Application Rejected",
    reason || "Your agent application was reviewed and rejected. Please contact support.",
    "/agent"
  );

  revalidatePath("/control-room-7f3k9d/agents");
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
