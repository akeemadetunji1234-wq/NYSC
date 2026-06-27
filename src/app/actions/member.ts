"use server";

import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";

// Get user profile by ID
export async function getUserProfile(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
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
  batch?: string;
  ppaState?: string;
  ppaLga?: string;
  ppaLatitude?: number;
  ppaLongitude?: number;
}) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
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
  try {
    // Check for existing review
    const existing = await prisma.review.findFirst({
      where: { propertyId: data.propertyId, corpMemberId: data.corpMemberId },
    });
    if (existing) throw new Error("ALREADY_REVIEWED");

    const review = await prisma.review.create({ data });
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
export async function getMemberBookings(memberId: string = "mock-corp-id") {
  try {
    const bookings = await prisma.booking.findMany({
      where: { corpMemberId: memberId },
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
export async function getSavedLodges(memberId: string = "mock-corp-id") {
  try {
    const saved = await prisma.savedProperty.findMany({
      where: { userId: memberId },
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

export async function toggleSavedLodge(propertyId: string, memberId: string = "mock-corp-id") {
  try {
    const existing = await prisma.savedProperty.findUnique({
      where: {
        userId_propertyId: {
          userId: memberId,
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
          userId: memberId,
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

export async function createBooking(propertyId: string, amount: number, memberId: string = "mock-corp-id") {
  try {
    // Ensure mock corp member exists for testing
    if (memberId === "mock-corp-id") {
      const existingUser = await prisma.user.findUnique({ where: { id: "mock-corp-id" } });
      if (!existingUser) {
        await prisma.user.create({
          data: {
            id: "mock-corp-id",
            name: "Mock Corp Member",
            email: "corp@mock.com",
            role: "CORP",
          }
        });
      }
    }

    const booking = await prisma.booking.create({
      data: {
        propertyId,
        corpMemberId: memberId,
        date: new Date(new Date().setMonth(new Date().getMonth() + 1)), // Mock move-in date: Next month
        time: "10:00 AM",
        amount: amount,
        status: "ACCEPTED", // Agent auto-accept for the demo
        feeStatus: "PAID",
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
