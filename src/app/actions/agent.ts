"use server";

import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole } from "../../lib/authGuard";
import { z } from "zod";
import { writeAuditLog } from "../../lib/audit";
import { createNotification } from "../../lib/notificationService";
import { after } from "next/server";

async function requireAgentAccess() {
  return requireRole("AGENT");
}

// Agent Profile
export async function getAgentProfile() {
  const user = await requireAgentAccess();
  const agentId = user.id;
  return await prisma.user.findUnique({
    where: { id: agentId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      whatsapp: true,
      image: true,
      agentVerified: true,
      agentVerifiedAt: true,
      isBanned: true,
      agentRejected: true,
      rejectionReason: true,
      verificationStatus: true,
      verificationNotes: true,
      agency: true,
      experience: true,
      operatingStates: true,
      bio: true,
      docType: true,
      docNumber: true,
      docUrl: true,
      isPremium: true,
      premiumPlan: true,
      premiumExpiry: true,
    }
  });
}

// Dashboard Stats
export async function getAgentDashboardStats() {
  const user = await requireAgentAccess();
  const agentId = user.id;
  const [activeProperties, totalBookings, confirmedExternalPayments, reviews] = await Promise.all([
    prisma.property.count({ where: { agentId, status: "PUBLISHED" } }),
    prisma.booking.count({ where: { property: { agentId } } }),
    prisma.booking.aggregate({
      where: { property: { agentId }, status: { in: ["ACCEPTED", "COMPLETED"] }, feeStatus: "PAID" },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.review.aggregate({
      where: { property: { agentId } },
      _avg: { rating: true },
      _count: { _all: true },
    }),
  ]);

  return {
    activeProperties,
    totalBookings,
    confirmedExternalPaymentValue: confirmedExternalPayments._sum.amount ?? 0,
    confirmedExternalPaymentCount: confirmedExternalPayments._count._all,
    avgRating: (reviews._avg.rating ?? 0).toFixed(1),
    reviewCount: reviews._count._all,
  };
}

// Bookings
export async function getAgentBookings() {
  const user = await requireAgentAccess();
  const agentId = user.id;
  try {
    const bookings = await prisma.booking.findMany({
      where: { property: { agentId } },
      select: {
        id: true,
        propertyId: true,
        corpMemberId: true,
        date: true,
        time: true,
        amount: true,
        status: true,
        feeStatus: true,
        createdAt: true,
        property: { select: { id: true, title: true, location: true, images: true } },
        corpMember: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return bookings;
  } catch (error) {
    console.error("Error in getAgentBookings:", error);
    return [];
  }
}

const bookingIdSchema = z.string().trim().min(1).max(100);
const bookingStatusSchema = z.enum(["PENDING", "ACCEPTED", "DECLINED", "COMPLETED"]);

export async function confirmExternalPayment(bookingId: string) {
  const user = await requireRole("AGENT");
  const safeBookingId = bookingIdSchema.parse(bookingId);
  const booking = await prisma.booking.findFirst({ where: { id: safeBookingId, property: { agentId: user.id } }, select: { id: true, status: true, feeStatus: true, corpMemberId: true, property: { select: { title: true } } } });
  if (!booking) throw new Error("Booking not found or not owned by this agent");
  if (booking.status !== "PENDING") throw new Error("Only pending booking requests can be payment-confirmed");
  const updated = await prisma.booking.updateMany({ where: { id: safeBookingId, status: "PENDING", feeStatus: "UNPAID", property: { agentId: user.id } }, data: { feeStatus: "PAID" } });
  if (updated.count !== 1 && booking.feeStatus !== "PAID") throw new Error("Booking changed; please refresh and try again");
  if (booking.feeStatus !== "PAID") {
    after(async () => {
      const results = await Promise.allSettled([
        createNotification(booking.corpMemberId, "BOOKING_STATUS_CHANGE", "Payment confirmed by agent", `The agent confirmed payment for ${booking.property.title}. You can now complete the booking request.`, "/member/history"),
        writeAuditLog("EXTERNAL_PAYMENT_CONFIRMED", safeBookingId, "Agent confirmed property payment outside the application"),
      ]);
      for (const result of results) {
        if (result.status === "rejected") console.error("Agent payment follow-up failed:", result.reason);
      }
    });
  }
  revalidatePath("/agent/bookings");
  revalidatePath("/member/history");
  return { ...booking, feeStatus: "PAID" as const };
}

export async function updateBookingStatus(bookingId: string, status: "PENDING" | "ACCEPTED" | "DECLINED" | "COMPLETED") {
  const user = await requireRole(["AGENT", "ADMIN"]);
  const safeBookingId = bookingIdSchema.parse(bookingId);
  const safeStatus = bookingStatusSchema.parse(status);
  const current = await prisma.booking.findFirst({
    where: { id: safeBookingId, ...(user.role === "AGENT" ? { property: { agentId: user.id } } : {}) },
    select: { status: true, feeStatus: true, corpMemberId: true, property: { select: { title: true } } },
  });
  if (!current) throw new Error("Booking not found or not owned by this agent");
  if (safeStatus === "ACCEPTED" && current.feeStatus !== "PAID") throw new Error("Confirm the property payment outside the app before accepting this booking");
  const result = user.role === "ADMIN"
    ? await prisma.booking.updateMany({ where: { id: safeBookingId }, data: { status: safeStatus } })
    : await prisma.booking.updateMany({ where: { id: safeBookingId, property: { agentId: user.id } }, data: { status: safeStatus } });
  if (result.count !== 1) throw new Error("Booking not found or not owned by this agent");
  after(async () => {
    const followUpTasks: Promise<unknown>[] = [
      writeAuditLog("BOOKING_STATUS_UPDATED", safeBookingId, `Booking status changed to ${safeStatus}`),
    ];
    if (current.status !== safeStatus) {
      followUpTasks.push(
        createNotification(
          current.corpMemberId,
          "BOOKING_STATUS_CHANGE",
          `Booking ${safeStatus.toLowerCase()}`,
          `Your booking for ${current.property.title} is now ${safeStatus.toLowerCase()}.`,
          "/member/history",
          {
            eventName: "booking:status",
            data: { bookingId: safeBookingId, status: safeStatus, propertyTitle: current.property.title },
          },
        ),
      );
    }
    const results = await Promise.allSettled(followUpTasks);
    for (const result of results) {
      if (result.status === "rejected") console.error("Agent booking follow-up failed:", result.reason);
    }
  });
  revalidatePath("/agent/bookings");
  revalidatePath("/agent");
}

// External payment confirmations are references only; the platform has no payout, escrow, or withdrawal ledger.
export async function getAgentEarnings() {
  const user = await requireAgentAccess();
  const agentId = user.id;
  const bookings = await prisma.booking.findMany({
    where: {
      property: { agentId },
      status: { in: ["ACCEPTED", "COMPLETED"] },
      feeStatus: "PAID",
    },
    select: {
      id: true,
      amount: true,
      status: true,
      feeStatus: true,
      createdAt: true,
      property: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    transactions: bookings,
    confirmedExternalPaymentValue: bookings.reduce((sum, booking) => sum + (booking.amount || 0), 0),
    confirmedExternalPaymentCount: bookings.length,
  };
}

// Reviews
export async function getAgentReviews() {
  const user = await requireAgentAccess();
  const agentId = user.id;
  const reviews = await prisma.review.findMany({
    where: {
      property: {
        agentId
      }
    },
    select: {
      id: true,
      rating: true,
      comment: true,
      reply: true,
      propertyId: true,
      corpMemberId: true,
      createdAt: true,
      property: { select: { id: true, title: true } },
      corpMember: { select: { id: true, name: true } },
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  return reviews;
}

export async function replyToReview(reviewId: string, replyText: string) {
  const user = await requireRole(["AGENT", "ADMIN"]);
  const safeReviewId = bookingIdSchema.parse(reviewId);
  const safeReply = typeof replyText === "string" ? replyText.trim() : "";
  if (!safeReply || safeReply.length > 2000) throw new Error("Reply is required and must be at most 2000 characters");
  const result = user.role === "ADMIN"
    ? await prisma.review.updateMany({ where: { id: safeReviewId }, data: { reply: safeReply } })
    : await prisma.review.updateMany({ where: { id: safeReviewId, property: { agentId: user.id } }, data: { reply: safeReply } });
  if (result.count !== 1) throw new Error("Review not found or not owned by this agent");
  await writeAuditLog("REVIEW_REPLIED", safeReviewId, "Agent or administrator replied to a review");
  revalidatePath("/agent/reviews");
}

export async function submitAgentVerification() {
  const user = await requireAgentAccess();
  const current = await prisma.user.findUnique({ where: { id: user.id }, select: { isBanned: true, verificationStatus: true } });
  if (!current || current.isBanned || current.verificationStatus === "DEACTIVATED") {
    throw new Error("AGENT_DEACTIVATED");
  }
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      verificationStatus: "PENDING",
      agentRejected: false,
      rejectionReason: null,
      verificationNotes: null,
    },
    select: {
      id: true,
      verificationStatus: true,
      agentRejected: true,
      rejectionReason: true,
    },
  });
  revalidatePath("/agent/verification");
  revalidatePath("/admin/agents");
  return updated;
}

export async function getAgentPropertiesAnalytics() {
  const user = await requireAgentAccess();
  const agentId = user.id;
  try {
        const properties = await prisma.property.findMany({
      where: { agentId },
      select: {
        id: true,
        title: true,
        status: true,
        views: true,
        inquiries: true,
        isBoosted: true,
        boostedUntil: true,
        _count: {
          select: {
            savedBy: true,
            bookings: true,
          }
        }
      }
    });

    return properties.map((p) => ({
      id: p.id,
      title: p.title,
      status: p.status,
      views: p.views,
      saves: p._count.savedBy,
      inquiries: p.inquiries,
      bookings: p._count.bookings,
      conversionRate: p.views > 0 ? Number(((p.inquiries / p.views) * 100).toFixed(2)) : 0,
      isBoosted: p.isBoosted && !!p.boostedUntil && p.boostedUntil > new Date(),
      boostedUntil: p.boostedUntil,
    }));
  } catch (error) {
    console.error("Error in getAgentPropertiesAnalytics:", error);
    return [];
  }
}
