"use server";

import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole, requireUser } from "../../lib/authGuard";

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
      agentVerified: true,
      agentVerifiedAt: true,
      agentRejected: true,
      rejectionReason: true,
      verificationStatus: true,
      verificationNotes: true,
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
  try {
    const properties = await prisma.property.findMany({
      where: { agentId },
      include: {
        bookings: true,
        reviews: true,
      }
    });

    const activeProperties = properties.filter(p => p.status === "PUBLISHED").length;
    
    const allBookings = properties.flatMap(p => p.bookings);
    const totalBookings = allBookings.length;
    
    const completedBookings = allBookings.filter(b => b.status === "COMPLETED" || b.status === "ACCEPTED");
    const totalEarnings = completedBookings.reduce((sum, b) => sum + (b.amount || 0), 0);

    const allReviews = properties.flatMap(p => p.reviews);
    const avgRating = allReviews.length > 0 
      ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1) 
      : "0.0";

    return {
      activeProperties,
      totalBookings,
      totalEarnings,
      avgRating,
      reviewCount: allReviews.length
    };
  } catch (error) {
    console.error("Error in getAgentDashboardStats:", error);
    return { activeProperties: 0, totalBookings: 0, totalEarnings: 0, avgRating: "0.0", reviewCount: 0 };
  }
}

// Bookings
export async function getAgentBookings() {
  const user = await requireAgentAccess();
  const agentId = user.id;
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        property: {
          agentId: agentId
        }
      },
      include: {
        property: true,
        corpMember: {
          select: { id: true, name: true, email: true, phone: true, whatsapp: true, batch: true, image: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    return bookings;
  } catch (error) {
    console.error("Error in getAgentBookings:", error);
    return [];
  }
}

export async function updateBookingStatus(bookingId: string, status: "PENDING" | "ACCEPTED" | "DECLINED" | "COMPLETED") {
  const user = await requireRole(["AGENT", "ADMIN"]);
  const result = user.role === "ADMIN"
    ? await prisma.booking.updateMany({ where: { id: bookingId }, data: { status } })
    : await prisma.booking.updateMany({ where: { id: bookingId, property: { agentId: user.id } }, data: { status } });
  if (result.count !== 1) throw new Error("Booking not found or not owned by this agent");
  revalidatePath("/agent/bookings");
  revalidatePath("/agent");
}

// Earnings (Using completed/accepted bookings as transactions)
export async function getAgentEarnings() {
  const user = await requireAgentAccess();
  const agentId = user.id;
  const bookings = await prisma.booking.findMany({
    where: {
      property: { agentId },
      status: { in: ["ACCEPTED", "COMPLETED"] }
    },
    include: {
      property: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const totalEarned = bookings.reduce((sum, b) => sum + (b.amount || 0), 0);
  
  // Fake available balance and pending logic for wireframe
  const availableBalance = totalEarned * 0.8; 
  const pendingClearance = totalEarned * 0.2;

  return {
    transactions: bookings,
    totalEarned,
    availableBalance,
    pendingClearance
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
    include: {
      property: true,
      corpMember: {
        select: { id: true, name: true, email: true, phone: true, whatsapp: true, batch: true, image: true }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  return reviews;
}

export async function replyToReview(reviewId: string, replyText: string) {
  const user = await requireRole(["AGENT", "ADMIN"]);
  if (!replyText.trim() || replyText.length > 2000) throw new Error("Reply is required and must be at most 2000 characters");
  const result = user.role === "ADMIN"
    ? await prisma.review.updateMany({ where: { id: reviewId }, data: { reply: replyText } })
    : await prisma.review.updateMany({ where: { id: reviewId, property: { agentId: user.id } }, data: { reply: replyText } });
  if (result.count !== 1) throw new Error("Review not found or not owned by this agent");
  revalidatePath("/agent/reviews");
}

export async function submitAgentVerification() {
  const user = await requireAgentAccess();
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
