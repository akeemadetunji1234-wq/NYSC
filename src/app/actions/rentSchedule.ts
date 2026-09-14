"use server";

import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { requireRole } from "../../lib/authGuard";
import { requirePremium } from "../../lib/entitlements";
import { revalidatePath } from "next/cache";

const bookingIdSchema = z.string().cuid();
const recurrenceSchema = z.enum(["ONE_TIME", "ANNUAL"]);
export async function setRentDueDate(bookingId: unknown, dueDate: unknown, recurrence: unknown) {
  const user = await requirePremium("AGENT_PREMIUM");
  const id = bookingIdSchema.parse(bookingId);
  const date = z.coerce.date().refine((value) => value > new Date(), "Due date must be in the future.").parse(dueDate);
  const repeat = recurrenceSchema.parse(recurrence);
  const booking = await prisma.booking.findFirst({ where: { id, property: { agentId: user.id } }, select: { id: true, corpMemberId: true } });
  if (!booking) throw new Error("Booking not found or not owned by this agent.");
  const schedule = await prisma.rentSchedule.upsert({ where: { bookingId: id }, update: { dueDate: date, recurrence: repeat, lastRemindedAt: null }, create: { bookingId: id, agentId: user.id, tenantId: booking.corpMemberId, dueDate: date, recurrence: repeat } });
  revalidatePath("/agent/bookings"); revalidatePath("/member/history"); return schedule;
}
export async function cancelRentSchedule(bookingId: unknown) { const user = await requireRole("AGENT"); const id = bookingIdSchema.parse(bookingId); const result = await prisma.rentSchedule.deleteMany({ where: { bookingId: id, agentId: user.id } }); if (result.count !== 1) throw new Error("Rent schedule not found."); revalidatePath("/agent/bookings"); return { success: true }; }
export async function getMyRentSchedules() { const user = await requireRole(["AGENT", "CORP"]); return prisma.rentSchedule.findMany({ where: user.role === "AGENT" ? { agentId: user.id } : { tenantId: user.id }, include: { booking: { select: { id: true, property: { select: { title: true } } } } }, orderBy: { dueDate: "asc" } }); }
