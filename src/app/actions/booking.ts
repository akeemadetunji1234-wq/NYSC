"use server";

import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { createNotification } from "../../lib/notificationService";
import { sendBookingConfirmationEmail, sendAgentBookingNotification } from "../../lib/email";
import { requireUser, requireRole } from "../../lib/authGuard";

export type RequestBookingInput = {
  propertyId: string;
  corpMemberId: string;
  date: Date;
  time: string;
};

// Request a new booking
export async function requestBooking(data: RequestBookingInput) {
  const user = await requireRole("CORP");
  if (!(data.date instanceof Date) || Number.isNaN(data.date.getTime())) throw new Error("Invalid booking date");
  if (!data.time || data.time.length > 50) throw new Error("Invalid booking time");

  try {
    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
      include: { agent: { select: { id: true, name: true, email: true } } },
    });
    if (!property || property.status !== "PUBLISHED") throw new Error("Property is not available");

    const existingBooking = await prisma.booking.findFirst({
      where: {
        propertyId: data.propertyId,
        corpMemberId: user.id,
        status: { in: ["PENDING", "ACCEPTED"] },
      },
    });
    if (existingBooking) throw new Error("You already have an active booking for this property");

    const booking = await prisma.booking.create({
      data: {
        propertyId: data.propertyId,
        corpMemberId: user.id,
        date: data.date,
        time: data.time,
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
        data.date.toDateString(),
        data.time,
        corpMember.name || "A user"
      );
      await sendBookingConfirmationEmail(
        corpMember.email || "",
        property.title,
        data.date.toDateString(),
        data.time
      );
    }

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
  const sessionUser = await requireUser();
  if (sessionUser.role !== "ADMIN" && (sessionUser.role !== "AGENT" || sessionUser.id !== agentId)) {
    throw new Error("Forbidden");
  }
  if (!agentId) return [];
  try {
    return await prisma.booking.findMany({
      where: { property: { agentId } },
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
export async function getMemberBookings(corpMemberId: string) {
  const sessionUser = await requireUser();
  if (sessionUser.role !== "ADMIN" && sessionUser.id !== corpMemberId) throw new Error("Forbidden");
  if (!corpMemberId) return [];
  try {
    return await prisma.booking.findMany({
      where: { corpMemberId: sessionUser.role === "ADMIN" ? corpMemberId : sessionUser.id },
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
  const user = await requireRole(["AGENT", "ADMIN"]);
  try {
    const result = user.role === "ADMIN"
      ? await prisma.booking.updateMany({ where: { id: bookingId }, data: { status } })
      : await prisma.booking.updateMany({ where: { id: bookingId, property: { agentId: user.id } }, data: { status } });
    if (result.count !== 1) throw new Error("Booking not found or not owned by this agent");

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { property: { select: { title: true } } },
    });
    if (!booking) throw new Error("Booking not found");

    await createNotification(
      booking.corpMemberId,
      "BOOKING_STATUS_CHANGE",
      `Booking ${status}`,
      `Your booking for ${booking.property.title} was marked as ${status}.`,
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
