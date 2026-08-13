"use server";

import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { createNotification } from "../../lib/notificationService";
import { requireUser } from "../../lib/authGuard";

// Get user profile by ID
export async function getUserProfile(userId: string) {
  const sessionUser = await requireUser();
  if (sessionUser.id !== userId) throw new Error("Forbidden");

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        whatsapp: true,
        batch: true,
        ppaState: true,
        ppaLga: true,
        ppaLatitude: true,
        ppaLongitude: true,
      }
    });
    return user;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw new Error("Failed to fetch profile");
  }
}

// Update member profile including PPA location
export async function updateMemberProfile(userId: string, data: {
  name?: string;
  phone?: string;
  whatsapp?: string;
  batch?: string;
  ppaState?: string;
  ppaLga?: string;
  ppaLatitude?: number;
  ppaLongitude?: number;
}) {
  const sessionUser = await requireUser();
  if (sessionUser.id !== userId) throw new Error("Forbidden");

  try {
    const user = await prisma.user.update({
      where: { id: sessionUser.id },
      data,
    });
    revalidatePath("/member/profile");
    return user;
  } catch (error) {
    console.error("Error updating profile:", error);
    throw new Error("Failed to update profile");
  }
}

// Check if a Corp member has a completed/accepted booking on a property
export async function hasCompletedBooking(propertyId: string, memberId: string): Promise<boolean> {
  const sessionUser = await requireUser();
  if (sessionUser.id !== memberId) throw new Error("Forbidden");

  try {
    const booking = await prisma.booking.findFirst({
      where: {
        propertyId,
        corpMemberId: memberId,
        status: { in: ["COMPLETED", "ACCEPTED"] },
      },
    });
    return !!booking;
  } catch {
    return false;
  }
}

// Submit a review for a property
export async function createReview(data: {
  propertyId: string;
  corpMemberId: string;
  rating: number;
  comment: string;
}) {
  const sessionUser = await requireUser();
  if (sessionUser.id !== data.corpMemberId) throw new Error("Forbidden");
  if (!Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5) {
    throw new Error("Rating must be an integer from 1 to 5");
  }
  if (!data.comment.trim() || data.comment.length > 2000) {
    throw new Error("Review comment is required and must be at most 2000 characters");
  }

  try {
    const eligibleBooking = await prisma.booking.findFirst({
      where: {
        propertyId: data.propertyId,
        corpMemberId: sessionUser.id,
        status: { in: ["COMPLETED", "ACCEPTED"] },
      },
      select: { id: true },
    });
    if (!eligibleBooking) throw new Error("You can only review a property after an accepted or completed booking");

    // Check for existing review
    const existing = await prisma.review.findFirst({
      where: { propertyId: data.propertyId, corpMemberId: data.corpMemberId },
    });
    if (existing) throw new Error("ALREADY_REVIEWED");

    const review = await prisma.review.create({ data });
    
    const property = await prisma.property.findUnique({ where: { id: data.propertyId } });
    if (property) {
      await createNotification(
        property.agentId,
        "NEW_REVIEW",
        "New Property Review",
        `Someone left a ${data.rating}-star review on ${property.title}.`,
        "/agent/reviews"
      );
    }

    revalidatePath(`/member/listing/${data.propertyId}`);
    revalidatePath("/agent/reviews");
    return review;
  } catch (error: any) {
    console.error("Error creating review:", error);
    throw error;
  }
}

// Fetch all reviews for a specific property
export async function getPropertyReviews(propertyId: string) {
  try {
    const reviews = await prisma.review.findMany({
      where: { propertyId },
      include: {
        corpMember: {
          select: { id: true, name: true, image: true, batch: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return reviews;
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }
}

// Bookings
export async function getMemberBookings(memberId: string) {
  const sessionUser = await requireUser();
  if (sessionUser.id !== memberId) throw new Error("Forbidden");

  try {
    const bookings = await prisma.booking.findMany({
      where: { corpMemberId: sessionUser.id },
      include: {
        property: {
          select: {
            title: true,
            location: true,
            images: true,
            price: true,
          }
        }
      },
      orderBy: { date: "desc" },
    });
    return bookings;
  } catch (error) {
    console.error("Error fetching member bookings:", error);
    throw new Error("Failed to fetch bookings");
  }
}

// Saved Lodges
export async function getSavedLodges(memberId: string) {
  const sessionUser = await requireUser();
  if (sessionUser.id !== memberId) throw new Error("Forbidden");

  try {
    const saved = await prisma.savedProperty.findMany({
      where: { userId: sessionUser.id },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            location: true,
            images: true,
            price: true,
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });
    return saved.map(s => s.property);
  } catch (error) {
    console.error("Error fetching saved lodges:", error);
    throw new Error("Failed to fetch saved lodges");
  }
}

export async function toggleSavedLodge(propertyId: string, memberId: string) {
  const sessionUser = await requireUser();
  if (sessionUser.id !== memberId) throw new Error("Forbidden");

  try {
    const existing = await prisma.savedProperty.findUnique({
      where: {
        userId_propertyId: {
          userId: sessionUser.id,
          propertyId: propertyId,
        }
      }
    });

    if (existing) {
      await prisma.savedProperty.delete({
        where: { id: existing.id }
      });
    } else {
      await prisma.savedProperty.create({
        data: {
          userId: sessionUser.id,
          propertyId: propertyId,
        }
      });
    }
    
    revalidatePath("/member");
    revalidatePath(`/member/listing/${propertyId}`);
    revalidatePath("/member/history");
    return !existing; // Returns true if saved, false if unsaved
  } catch (error) {
    console.error("Error toggling saved lodge:", error);
    throw new Error("Failed to toggle saved lodge");
  }
}

export async function createBooking(propertyId: string, amount: number, memberId: string) {
  const sessionUser = await requireUser();
  if (sessionUser.id !== memberId) throw new Error("Forbidden");

  try {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { price: true, status: true },
    });
    if (!property || property.status !== "PUBLISHED") {
      throw new Error("Property is not available for booking");
    }

    const existingBooking = await prisma.booking.findFirst({
      where: {
        propertyId,
        corpMemberId: sessionUser.id,
        status: { in: ["PENDING", "ACCEPTED"] }
      }
    });

    if (existingBooking) {
      throw new Error("You already have an active booking for this property.");
    }

    const booking = await prisma.booking.create({
      data: {
        propertyId,
        corpMemberId: sessionUser.id,
        date: new Date(new Date().setMonth(new Date().getMonth() + 1)), // Mock move-in date: Next month
        time: "10:00 AM",
        amount: property.price,
        status: "PENDING",
        feeStatus: "UNPAID",
      }
    });

    revalidatePath("/member/history");
    revalidatePath("/agent/bookings");
    return booking;
  } catch (error) {
    console.error("Error creating booking:", error);
    throw new Error("Failed to create booking");
  }
}

// Fetch recent properties for real-time alerts
export async function getRecentProperties(state?: string) {
  try {
    const where: any = { status: "PUBLISHED" };
    if (state) where.state = state;
    
    const properties = await prisma.property.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    return properties;
  } catch (error) {
    console.error("Error fetching recent properties:", error);
    return [];
  }
}
