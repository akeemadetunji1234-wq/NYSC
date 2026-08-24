"use server";

import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { createNotification } from "../../lib/notificationService";
import { z } from "zod";
import { requireRole, requireUser } from "../../lib/authGuard";
import { rateLimit } from "../../lib/rateLimit";

// Get user profile by ID
export async function getUserProfile() {
  const sessionUser = await requireUser();
  const userId = sessionUser.id;

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
const profileSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  whatsapp: z.string().trim().max(40).nullable().optional(),
  batch: z.string().trim().max(40).nullable().optional(),
  ppaState: z.string().trim().max(120).nullable().optional(),
  ppaLga: z.string().trim().max(120).nullable().optional(),
  ppaLatitude: z.number().finite().min(-90).max(90).nullable().optional(),
  ppaLongitude: z.number().finite().min(-180).max(180).nullable().optional(),
  agency: z.string().trim().max(200).nullable().optional(),
  experience: z.string().trim().max(100).nullable().optional(),
  operatingStates: z.array(z.string().trim().max(100)).nullable().optional(),
  bio: z.string().trim().max(5000).nullable().optional(),
});

export async function updateMemberProfile(data: unknown) {
  const sessionUser = await requireUser();

  const parsed = profileSchema.safeParse(data);
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    throw new Error("Invalid profile details");
  }

  try {
    const user = await prisma.user.update({
      where: { id: sessionUser.id },
      data: parsed.data,
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
        agency: true,
        experience: true,
        operatingStates: true,
        bio: true,
      },
    });
    revalidatePath("/member/profile");
    return user;
  } catch (error) {
    console.error("Error updating profile:", error);
    throw new Error("Failed to update profile");
  }
}

// Check if a Corp member has a completed/accepted booking on a property
export async function hasCompletedBooking(propertyId: string): Promise<boolean> {
  const sessionUser = await requireRole("CORP");

  try {
    const booking = await prisma.booking.findFirst({
      where: {
        propertyId,
        corpMemberId: sessionUser.id,
        status: { in: ["COMPLETED", "ACCEPTED"] },
      },
    });
    return !!booking;
  } catch {
    return false;
  }
}

// Submit a review for a property
const reviewSchema = z.object({
  propertyId: z.string().min(1).max(100),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(1).max(2000),
});

export async function createReview(data: unknown) {
  const sessionUser = await requireRole("CORP");
  const parsed = reviewSchema.safeParse(data);
  if (!parsed.success) throw new Error("Invalid review details");
  const reviewData = parsed.data;

  try {
    const eligibleBooking = await prisma.booking.findFirst({
      where: {
        propertyId: reviewData.propertyId,
        corpMemberId: sessionUser.id,
        status: { in: ["COMPLETED", "ACCEPTED"] },
      },
      select: { id: true },
    });
    if (!eligibleBooking) throw new Error("You can only review a property after an accepted or completed booking");

    // Check for existing review
    const existing = await prisma.review.findFirst({
      where: { propertyId: reviewData.propertyId, corpMemberId: sessionUser.id },
    });
    if (existing) throw new Error("ALREADY_REVIEWED");

    const review = await prisma.review.create({
      data: {
        propertyId: reviewData.propertyId,
        corpMemberId: sessionUser.id,
        rating: reviewData.rating,
        comment: reviewData.comment,
      },
      select: {
        id: true,
        propertyId: true,
        corpMemberId: true,
        rating: true,
        comment: true,
        createdAt: true,
      },
    });
    
    const property = await prisma.property.findUnique({ where: { id: reviewData.propertyId } });
    if (property) {
      await createNotification(
        property.agentId,
        "NEW_REVIEW",
        "New Property Review",
        `Someone left a ${reviewData.rating}-star review on ${property.title}.`,
        "/agent/reviews"
      );
    }

    revalidatePath(`/member/listing/${reviewData.propertyId}`);
    revalidatePath("/agent/reviews");
    return review;
  } catch (error: any) {
    console.error("Error creating review:", error);
    throw error;
  }
}

// Fetch all reviews for a specific property
export async function getPropertyReviews(propertyId: string) {
  if (typeof propertyId !== "string" || propertyId.length === 0 || propertyId.length > 100) return [];
  try {
    const property = await prisma.property.findUnique({ where: { id: propertyId }, select: { status: true } });
    if (!property || property.status !== "PUBLISHED") return [];
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
export async function getMemberBookings() {
  const sessionUser = await requireRole("CORP");

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
export async function getSavedLodges() {
  const sessionUser = await requireRole("CORP");

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

export async function toggleSavedLodge(propertyId: string) {
  const sessionUser = await requireRole("CORP");
  if (!propertyId || propertyId.length > 100) throw new Error("Invalid property identifier");

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
      await prisma.propertyEvent.create({ data: { propertyId, viewerId: sessionUser.id, type: "SAVE" } });
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

export async function createBooking(propertyId: string) {
  const sessionUser = await requireRole("CORP");
  if (!propertyId || propertyId.length > 100) throw new Error("Invalid property identifier");
  const limit = await rateLimit(`booking:${sessionUser.id}`, 5, 60 * 60 * 1000);
  if (!limit.success) throw new Error("Too many booking requests. Please try again later.");

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
