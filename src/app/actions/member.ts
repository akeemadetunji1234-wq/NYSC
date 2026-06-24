"use server";

import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";

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
