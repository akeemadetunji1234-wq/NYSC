"use server";

import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { createNotification } from "../../lib/notificationService";
import { sendBookingConfirmationEmail, sendAgentBookingNotification } from "../../lib/email";
import { requireRole } from "../../lib/authGuard";
import { z } from "zod";
import { rateLimit } from "../../lib/rateLimit";
import { after } from "next/server";
import { writeAuditLog } from "../../lib/audit";
import { ACTIVE_BOOKING_STATUSES, getBookingDayRange, lockBookingSlot } from "../../lib/bookingConcurrency";

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
  const bookingTime = bookingData.time.trim().replace(/\s+/g, " ");

  try {
    const transactionResult = await prisma.$transaction(async (tx) => {
      const property = await tx.property.findUnique({
        where: { id: bookingData.propertyId },
        include: { agent: { select: { id: true, name: true, email: true } } },
      });
      if (!property || property.status !== "PUBLISHED") throw new Error("Property is not available");

      // Serialize every request for the same listing slot before checking conflicts.
      await lockBookingSlot(tx, property.id, bookingData.date, bookingTime);
      const { start: dayStart, end: dayEnd } = getBookingDayRange(bookingData.date);
      const [existingBooking, conflictingBooking] = await Promise.all([
        tx.booking.findFirst({
          where: { propertyId: property.id, corpMemberId: user.id, status: { in: ACTIVE_BOOKING_STATUSES } },
        }),
        tx.booking.findFirst({
          where: { propertyId: property.id, date: { gte: dayStart, lt: dayEnd }, time: bookingTime, status: { in: ACTIVE_BOOKING_STATUSES } },
          select: { id: true },
        }),
      ]);
      if (existingBooking) throw new Error("You already have an active booking for this property");
      if (conflictingBooking) throw new Error("This viewing time is no longer available");

      const booking = await tx.booking.create({
        data: {
          propertyId: property.id,
          corpMemberId: user.id,
          date: bookingData.date,
          time: bookingTime,
          amount: property.price,
          status: "PENDING",
          feeStatus: "UNPAID",
        },
      });
      return { booking, property };
    });
    const { booking, property } = transactionResult;

    const corpMember = await prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, email: true },
    });

    if (corpMember) {
      after(async () => {
        try {
          const agentNotification = await createNotification(
            property.agentId,
            "NEW_BOOKING",
            "New Booking Request",
            `${corpMember.name} requested a viewing for ${property.title}.`,
            "/agent",
            { dedupeKey: `booking:${booking.id}:agent` },
          );
          const memberNotification = await createNotification(
            user.id,
            "BOOKING_STATUS_CHANGE",
            "Booking Request Sent",
            `Your viewing request for ${property.title} has been sent to the agent.`,
            "/member/history",
            { dedupeKey: `booking:${booking.id}:member` },
          );
          const deliveries = await Promise.allSettled([
            sendAgentBookingNotification(
              property.agent.email || "",
              property.title,
              bookingData.date.toDateString(),
              bookingTime,
              corpMember.name || "A user",
              agentNotification.id,
            ),
            sendBookingConfirmationEmail(
              corpMember.email || "",
              property.title,
              bookingData.date.toDateString(),
              bookingTime,
              memberNotification.id,
            ),
          ]);
          for (const delivery of deliveries) {
            if (delivery.status === "rejected") console.error("Booking notification delivery failed:", delivery.reason);
          }
        } catch (error) {
          console.error("Booking notification setup failed:", error);
        }
      });
    }

    revalidatePath(`/member/listing/${bookingData.propertyId}`);
    revalidatePath("/member/history");
    return booking;
  } catch (error) {
    console.error("Error requesting booking:", error);
    if (error instanceof Error && ["Property is not available", "You already have an active booking for this property", "This viewing time is no longer available"].includes(error.message)) throw error;
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
export async function cancelBooking(bookingId: string) {
  const user = await requireRole("CORP");
  const safeBookingId = idSchema.parse(bookingId);
  const current = await prisma.booking.findFirst({ where: { id: safeBookingId, corpMemberId: user.id }, include: { property: { select: { title: true, agentId: true } } } });
  if (!current) throw new Error("Booking not found");
  if (!["PENDING", "ACCEPTED"].includes(current.status)) throw new Error("This booking can no longer be cancelled");
  const result = await prisma.booking.updateMany({ where: { id: safeBookingId, corpMemberId: user.id, status: current.status }, data: { status: "CANCELLED" } });
  if (result.count !== 1) throw new Error("Booking changed; please refresh and try again");
  await writeAuditLog("BOOKING_CANCELLED", safeBookingId, `Member cancelled booking for ${current.property.title}`);
  await createNotification(current.property.agentId, "BOOKING_STATUS_CHANGE", "Booking cancelled", `A member cancelled the viewing request for ${current.property.title}.`, "/agent/bookings");
  revalidatePath("/member/history");
  revalidatePath("/agent/bookings");
  return { id: safeBookingId, status: "CANCELLED" as const };
}

export async function rescheduleBooking(bookingId: string, date: Date, time: string) {
  const user = await requireRole("CORP");
  const safeBookingId = idSchema.parse(bookingId);
  const parsedDate = z.date().parse(date);
  const parsedTime = z.string().trim().min(1).max(50).parse(time);
  if (parsedDate.getTime() <= Date.now()) throw new Error("New booking date must be in the future");
  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.booking.findFirst({ where: { id: safeBookingId, corpMemberId: user.id }, include: { property: { select: { id: true, title: true, agentId: true } } } });
    if (!current) throw new Error("Booking not found");
    if (!["PENDING", "ACCEPTED"].includes(current.status)) throw new Error("This booking can no longer be rescheduled");

    await lockBookingSlot(tx, current.property.id, parsedDate, parsedTime);
    const { start: dayStart, end: dayEnd } = getBookingDayRange(parsedDate);
    const conflictingBooking = await tx.booking.findFirst({
      where: { propertyId: current.property.id, date: { gte: dayStart, lt: dayEnd }, time: parsedTime, status: { in: ACTIVE_BOOKING_STATUSES }, NOT: { id: safeBookingId } },
      select: { id: true },
    });
    if (conflictingBooking) throw new Error("This viewing time is no longer available");

    const updated = await tx.booking.updateMany({ where: { id: safeBookingId, corpMemberId: user.id, status: current.status }, data: { date: parsedDate, time: parsedTime } });
    if (updated.count !== 1) throw new Error("Booking changed; please refresh and try again");
    await tx.auditLog.create({ data: { action: "BOOKING_RESCHEDULED", target: safeBookingId, details: `Member rescheduled booking to ${parsedDate.toISOString()} ${parsedTime}`, userId: user.id } });
    return { current, date: parsedDate, time: parsedTime };
  });
  await createNotification(result.current.property.agentId, "BOOKING_STATUS_CHANGE", "Booking rescheduled", `A member rescheduled the viewing request for ${result.current.property.title} to ${result.date.toLocaleDateString()} at ${result.time}.`, "/agent/bookings");
  revalidatePath("/member/history");
  revalidatePath("/agent/bookings");
  return { id: safeBookingId, date: result.date, time: result.time };
}

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
