"use server";

import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";

// Agent Profile
export async function getAgentProfile(agentId: string = "mock-agent-id") {
  return await prisma.user.findUnique({
    where: { id: agentId },
    select: { id: true, name: true, agentVerified: true }
  });
}

// Dashboard Stats
export async function getAgentDashboardStats(agentId: string = "mock-agent-id") {
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
}

// Bookings
export async function getAgentBookings(agentId: string = "mock-agent-id") {
  const bookings = await prisma.booking.findMany({
    where: {
      property: {
        agentId: agentId
      }
    },
    include: {
      property: true,
      corpMember: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return bookings;
}

export async function updateBookingStatus(bookingId: string, status: "PENDING" | "ACCEPTED" | "DECLINED" | "COMPLETED") {
  await prisma.booking.update({
    where: { id: bookingId },
    data: { status }
  });
  revalidatePath("/agent/bookings");
  revalidatePath("/agent");
}

// Earnings (Using completed/accepted bookings as transactions)
export async function getAgentEarnings(agentId: string = "mock-agent-id") {
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
export async function getAgentReviews(agentId: string = "mock-agent-id") {
  const reviews = await prisma.review.findMany({
    where: {
      property: {
        agentId
      }
    },
    include: {
      property: true,
      corpMember: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  return reviews;
}

export async function replyToReview(reviewId: string, replyText: string) {
  await prisma.review.update({
    where: { id: reviewId },
    data: { reply: replyText }
  });
  revalidatePath("/agent/reviews");
}
