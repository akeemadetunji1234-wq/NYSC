"use server";

import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { createNotification } from "../../lib/notificationService";
import { sendBookingConfirmationEmail, sendAgentBookingNotification } from "../../lib/email";
import { requireUser, requireRole } from "../../lib/authGuard";
import { z } from "zod";
import { rateLimit } from "../../lib/rateLimit";

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
  const limit = rateLimit(`booking:create:${user.id}`, 20, 15 * 60 * 1000);
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
      await createNotification(
        property.agentId,
        "NEW_BOOKING",
        "New Booking Request",
        `${corpMember.name} requested a viewing for ${property.title}.`,
        "/agent"
      );

      await sendAgentBookingNotification(
        property.agent.email || "",
        property.title,
        bookingData.date.toDateString(),
        bookingData.time,
        corpMember.name || "A user"
      );
      await sendBookingConfirmationEmail(
        corpMember.email || "",
        property.title,
        bookingData.date.toDateString(),
        bookingData.time
      );
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

// Update booking status
export async function updateBookingStatus(bookingId: string, status: "ACCEPTED" | "DECLINED" | "COMPLETED") {
  const safeBookingId = idSchema.parse(bookingId);
  const safeStatus = bookingStatusSchema.parse(status);
  const user = await requireRole(["AGENT", "ADMIN"]);
  try {
    const result = user.role === "ADMIN"
      ? await prisma.booking.updateMany({ where: { id: safeBookingId }, data: { status: safeStatus } })
      : await prisma.booking.updateMany({ where: { id: safeBookingId, property: { agentId: user.id } }, data: { status: safeStatus } });
    if (result.count !== 1) throw new Error("Booking not found or not owned by this agent");

    const booking = await prisma.booking.findUnique({
      where: { id: safeBookingId },
      include: { property: { select: { title: true } } },
    });
    if (!booking) throw new Error("Booking not found");

    await createNotification(
      booking.corpMemberId,
      "BOOKING_STATUS_CHANGE",
      `Booking ${safeStatus}`,
      `Your booking for ${booking.property.title} was marked as ${safeStatus}.`,
      "/member/history"
    );

    revalidatePath("/agent");
    revalidatePath("/member/history");
    return booking;
  } catch (error) {
    console.error("Error updating booking status:", error);
    throw new Error("Failed to update booking status");
  }
}
