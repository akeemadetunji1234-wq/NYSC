import type { BookingStatus, Prisma } from "@prisma/client";

export const ACTIVE_BOOKING_STATUSES: BookingStatus[] = ["PENDING", "ACCEPTED"];

export function getBookingDayRange(date: Date) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
}

export function getBookingSlotKey(propertyId: string, date: Date, time: string) {
  return `${propertyId}:${date.toISOString().slice(0, 10)}:${time.trim().replace(/\s+/g, " ").toLowerCase()}`;
}

export async function lockBookingSlot(tx: Prisma.TransactionClient, propertyId: string, date: Date, time: string) {
  const slotKey = getBookingSlotKey(propertyId, date, time);
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${slotKey}, 0))`;
}
