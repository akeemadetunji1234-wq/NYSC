"use server";

import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";

export type RequestBookingInput = {
  propertyId: string;
  corpMemberId: string;
  date: Date;
  time: string;
};

// Request a new booking
export async function requestBooking(data: RequestBookingInput) {
  try {
    const booking = await prisma.booking.create({
      data: {
        ...data,
        status: "PENDING",
        feeStatus: "UNPAID",
      },
    });
    
    revalidatePath(`/member/listing/${data.propertyId}`);
    revalidatePath("/member/history");
    
    return booking;
  } catch (error) {
    console.error("Error requesting booking:", error);
    throw new Error("Failed to request booking");
  }
}

// Get bookings for an Agent
export async function getAgentBookings(agentId: string) {
  if (!agentId) return [];
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        property: {
          agentId,
        },
      },
      include: {
        property: {
          select: { title: true, location: true, images: true },
        },
        corpMember: {
          select: { name: true, email: true, phone: true, batch: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return bookings;
  } catch (error) {
    console.error("Error fetching agent bookings:", error);
    throw new Error("Failed to fetch agent bookings");
  }
}

// Get bookings for a Corp Member
export async function getMemberBookings(corpMemberId: string) {
  if (!corpMemberId) return [];
  try {
    const bookings = await prisma.booking.findMany({
      where: { corpMemberId },
      include: {
        property: {
          select: { title: true, location: true, images: true, price: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return bookings;
  } catch (error) {
    console.error("Error fetching member bookings:", error);
    throw new Error("Failed to fetch member bookings");
  }
}

// Update booking status
export async function updateBookingStatus(bookingId: string, status: "ACCEPTED" | "DECLINED" | "COMPLETED") {
  try {
    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status },
    });
    
    revalidatePath("/agent");
    revalidatePath("/member/history");
    
    return booking;
  } catch (error) {
    console.error("Error updating booking status:", error);
    throw new Error("Failed to update booking status");
  }
}
