"use server";

import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { createNotification } from "../../lib/notificationService";
import { sendBookingConfirmationEmail, sendAgentBookingNotification } from "../../lib/email";
import { requireRole } from "../../lib/authGuard";
import { z } from "zod";
import { rateLimit } from "../../lib/rateLimit";
import { after } from "next/server";

export type RequestBookingInput = {
  propertyId: string;
  date: Date;
  time: string;
};

// Request a new booking
const requestBookingSchema = z.object({
  propertyId: z.string().trim().min(1).max(100),
  date: z.date(),
  time: z.string().trim().min(1).max(50),
});
const bookingStatusSchema = z.enum(["ACCEPTED", "DECLINED", "COMPLETED"]);
const idSchema = z.string().trim().min(1).max(100);

export async function requestBooking(data: unknown) {
  const user = await requireRole("CORP");
  const parsed = requestBookingSchema.safeParse(data);
  if (!parsed.success) throw new Error("Invalid booking details");
  if (parsed.data.date.getTime() < Date.now()) throw new Error("Booking date must be in the future");
  const limit = await rateLimit(`booking:create:${user.id}`, 20, 15 * 60 * 1000);
  if (!limit.success) throw new Error("Too many booking requests. Please try again later.");
  const bookingData = parsed.data;

  try {
    const property = await prisma.property.findUnique({
      where: { id: bookingData.propertyId },
      include: { agent: { select: { id: true, name: true, email: true } } },
    });
    if (!property || property.status !== "PUBLISHED") throw new Error("Property is not available");

    const existingBooking = await prisma.booking.findFirst({
      where: {
        propertyId: bookingData.propertyId,
        corpMemberId: user.id,
        status: { in: ["PENDING", "ACCEPTED"] },
      },
    });
    if (existingBooking) throw new Error("You already have an active booking for this property");

    const booking = await prisma.booking.create({
      data: {
        propertyId: bookingData.propertyId,
        corpMemberId: user.id,
        date: bookingData.date,
        time: bookingData.time,
        amount: property.price,
        status: "PENDING",
        feeStatus: "UNPAID",
      },
    });

    const corpMember = await prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, email: true },
    });

    if (corpMember) {
      after(async () => {
        const deliveries = await Promise.allSettled([
          createNotification(
            property.agentId,
            "NEW_BOOKING",
            "New Booking Request",
            `${corpMember.name} requested a viewing for ${property.title}.`,
            "/agent"
          ),
          sendAgentBookingNotification(
            property.agent.email || "",
            property.title,
            bookingData.date.toDateString(),
            bookingData.time,
            corpMember.name || "A user"
          ),
          sendBookingConfirmationEmail(
            corpMember.email || "",
            property.title,
            bookingData.date.toDateString(),
            bookingData.time
          ),
        ]);
        for (const delivery of deliveries) {
          if (delivery.status === "rejected") console.error("Booking notification delivery failed:", delivery.reason);
        }
      });
    }

    revalidatePath(`/member/listing/${bookingData.propertyId}`);
    revalidatePath("/member/history");
    return booking;
  } catch (error) {
    console.error("Error requesting booking:", error);
    throw new Error("Failed to request booking");
  }
}

// Get bookings for an Agent
export async function getAgentBookings() {
  const sessionUser = await requireRole("AGENT");
  try {
    return await prisma.booking.findMany({
      where: { property: { agentId: sessionUser.id } },
      include: {
        property: { select: { title: true, location: true, images: true } },
        corpMember: { select: { name: true, email: true, phone: true, batch: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching agent bookings:", error);
    throw new Error("Failed to fetch agent bookings");
  }
}

// Get bookings for a Corp Member
export async function getMemberBookings() {
  const sessionUser = await requireRole("CORP");
  try {
    return await prisma.booking.findMany({
      where: { corpMemberId: sessionUser.id },
      include: { property: { select: { title: true, location: true, images: true, price: true } } },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching member bookings:", error);
    throw new Error("Failed to fetch member bookings");
  }
}

// Update booking status. Legal transitions are PENDING -> ACCEPTED/DECLINED and ACCEPTED -> COMPLETED.
export async function updateBookingStatus(bookingId: string, status: "ACCEPTED" | "DECLINED" | "COMPLETED") {
  const safeBookingId = idSchema.parse(bookingId);
  const safeStatus = bookingStatusSchema.parse(status);
  const user = await requireRole(["AGENT", "ADMIN"]);
  const allowedTransitions: Record<string, string[]> = {
    PENDING: ["ACCEPTED", "DECLINED"],
    ACCEPTED: ["COMPLETED"],
    DECLINED: [],
    COMPLETED: [],
  };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.booking.findUnique({
        where: { id: safeBookingId },
        include: { property: { select: { title: true, agentId: true } } },
      });
      if (!current || (user.role === "AGENT" && current.property.agentId !== user.id)) {
        throw new Error("Booking not found or not owned by this agent");
      }
      if (current.status === safeStatus) return { booking: current, changed: false };
      if (!allowedTransitions[current.status]?.includes(safeStatus)) {
        throw new Error(`Invalid booking transition from ${current.status} to ${safeStatus}`);
      }

      const updated = await tx.booking.updateMany({
        where: { id: safeBookingId, status: current.status },
        data: { status: safeStatus },
      });
      if (updated.count !== 1) throw new Error("Booking changed; please refresh and try again");

      await tx.auditLog.create({
        data: {
          action: "BOOKING_STATUS_CHANGED",
          target: safeBookingId,
          details: `${current.status} -> ${safeStatus}`,
          userId: user.id,
        },
      });

      const booking = await tx.booking.findUnique({
        where: { id: safeBookingId },
        include: { property: { select: { title: true } } },
      });
      if (!booking) throw new Error("Booking not found after update");
      return { booking, changed: true };
    });

    if (result.changed) {
      await createNotification(
        result.booking.corpMemberId,
        "BOOKING_STATUS_CHANGE",
        `Booking ${safeStatus}`,
        `Your booking for ${result.booking.property.title} was marked as ${safeStatus}.`,
        "/member/history",
      );
    }

    revalidatePath("/agent");
    revalidatePath("/member/history");
    return result.booking;
  } catch (error) {
    console.error("Error updating booking status:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to update booking status");
  }
}
