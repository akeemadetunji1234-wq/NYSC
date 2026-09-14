import { NotificationType, RentRecurrence } from "@prisma/client";
import { prisma } from "./prisma";
import { createNotification } from "./notificationService";

const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOWS = [7, 1] as const;

export async function createRentDueReminders(now = new Date()) {
  const schedules = await prisma.rentSchedule.findMany({ where: { dueDate: { lte: new Date(now.getTime() + 7 * DAY_MS) } }, include: { booking: { select: { property: { select: { title: true } } } }, }, });
  let created = 0, duplicates = 0, rolled = 0;
  for (const schedule of schedules) {
    let dueDate = schedule.dueDate;
    while (schedule.recurrence === RentRecurrence.ANNUAL && dueDate <= now) { dueDate = new Date(dueDate); dueDate.setUTCFullYear(dueDate.getUTCFullYear() + 1); }
    if (dueDate.getTime() !== schedule.dueDate.getTime()) { await prisma.rentSchedule.update({ where: { id: schedule.id }, data: { dueDate, lastRemindedAt: null } }); rolled += 1; }
    const daysOut = Math.ceil((dueDate.getTime() - now.getTime()) / DAY_MS);
    const window = WINDOWS.find((value) => daysOut <= value && daysOut >= 0);
    if (window === undefined) continue;
    const dedupeKey = `rent-due:${schedule.id}:${dueDate.toISOString()}:${window}`;
    try { await createNotification(schedule.tenantId, NotificationType.RENT_DUE_REMINDER, "Rent due reminder", `Rent for ${schedule.booking.property.title} is due in ${daysOut <= 1 ? "1 day" : `${daysOut} days`}.`, "/member/history", { dedupeKey }); created += 1; } catch (error) { if ((error as any)?.code === "P2002") duplicates += 1; else throw error; }
  }
  return { scanned: schedules.length, created, duplicates, rolled };
}
