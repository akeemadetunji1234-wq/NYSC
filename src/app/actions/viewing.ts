"use server";

import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { createNotification } from "../../lib/notificationService";
import { requireRole, requireOwnerOrAdmin } from "../../lib/authGuard";
import { z } from "zod";
import { rateLimit } from "../../lib/rateLimit";
import { after } from "next/server";
import { sendViewingNotificationEmail } from "../../lib/email";

const idSchema = z.string().trim().min(1).max(100);
const viewingStatusSchema = z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]);
const viewingTimeSchema = z.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid viewing time");

function datePartsInLagos(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export async function scheduleViewing(propertyId: string, date: Date, time: string) {
  const user = await requireRole("CORP");
  const safePropertyId = idSchema.parse(propertyId);
  const safeDate = z.date().safeParse(date);
  const safeTime = viewingTimeSchema.safeParse(time);
  const selectedDate = safeDate.success
    ? `${safeDate.data.getUTCFullYear()}-${String(safeDate.data.getUTCMonth() + 1).padStart(2, "0")}-${String(safeDate.data.getUTCDate()).padStart(2, "0")}`
    : "";
  const selectedMinutes = safeTime.success
    ? Number(safeTime.data.slice(0, 2)) * 60 + Number(safeTime.data.slice(3, 5))
    : -1;
  const now = new Date();
  const currentDate = datePartsInLagos(now);
  const currentLagosTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
  const currentMinutes = Number(currentLagosTime.slice(0, 2)) * 60 + Number(currentLagosTime.slice(3, 5));
  const isPast = selectedDate < currentDate || (selectedDate === currentDate && selectedMinutes <= currentMinutes);
  if (!safeDate.success || !safeTime.success || isPast) {
    throw new Error("Invalid viewing date or time");
  }
  const limit = await rateLimit(`viewing:create:${user.id}`, 20, 15 * 60 * 1000);
  if (!limit.success) throw new Error("Too many viewing requests. Please try again later.");
  const corpMemberId = user.id;
  try {
    const property = await prisma.property.findUnique({
      where: { id: safePropertyId },
      include: { agent: { select: { email: true } } },
    });
    if (!property || property.status !== "PUBLISHED") throw new Error("Property is not available");

    const viewing = await prisma.viewing.create({
      data: {
        propertyId: safePropertyId,
        corpMemberId,
        date: safeDate.data,
        time: safeTime.data,
        status: "PENDING"
      }
    });

    if (property) {
      after(() => {
        void (async () => {
          try {
            const notification = await createNotification(
              property.agentId,
              "VIEWING_UPDATE",
              "New Viewing Scheduled",
              `A new viewing was scheduled for ${property.title}.`,
              "/agent/viewings",
            );
            await sendViewingNotificationEmail({
              notificationId: notification.id,
              email: property.agent.email,
              propertyName: property.title,
              date: safeDate.data.toLocaleDateString("en-NG"),
              time: safeTime.data,
              status: "REQUESTED",
              recipientLabel: "agent",
            });
          } catch (error) {
            console.error("Viewing notification delivery failed:", error);
          }
        })();
      });
    }

    revalidatePath("/agent/viewings");
    return viewing;
  } catch (error) {
    console.error("Error scheduling viewing:", error);
    throw new Error("Failed to schedule viewing");
  }
}

export async function getAgentViewings() {
  const sessionUser = await requireRole("AGENT");
  try {
    const viewings = await prisma.viewing.findMany({
      where: {
        property: { agentId: sessionUser.id }
      },
      include: {
        property: { select: { id: true, title: true, location: true, images: true, price: true, status: true } },
        corpMember: { select: { id: true, name: true, email: true, phone: true, whatsapp: true, batch: true, image: true } },
      },
      orderBy: {
        date: "asc"
      }
    });
    return viewings;
  } catch (error) {
    console.error("Error fetching viewings:", error);
    throw new Error("Failed to fetch viewings");
  }
}

export async function updateViewingStatus(viewingId: string, status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED") {
  const safeViewingId = idSchema.parse(viewingId);
  const safeStatus = viewingStatusSchema.parse(status);
  const sessionUser = await requireRole(["AGENT", "ADMIN"]);
  try {
    const existingViewing = await prisma.viewing.findUnique({
      where: { id: safeViewingId },
      include: { property: true, corpMember: { select: { email: true } } },
    });
    if (!existingViewing) throw new Error("Viewing not found");
    if (sessionUser.role !== "ADMIN" && existingViewing.property.agentId !== sessionUser.id) {
      throw new Error("Forbidden");
    }

    const viewing = await prisma.viewing.update({
      where: { id: safeViewingId },
      data: { status: safeStatus },
      include: {
        property: { select: { id: true, title: true, location: true, images: true, price: true, status: true } },
        corpMember: { select: { email: true } },
      }
    });

    after(() => {
      void (async () => {
        try {
          const notification = await createNotification(
            viewing.corpMemberId,
            "VIEWING_UPDATE",
            `Viewing ${safeStatus}`,
            `Your viewing for ${viewing.property.title} is now ${safeStatus}.`,
            "/member/history",
          );
          await sendViewingNotificationEmail({
            notificationId: notification.id,
            email: viewing.corpMember.email,
            propertyName: viewing.property.title,
            date: viewing.date.toLocaleDateString("en-NG"),
            time: viewing.time,
            status: safeStatus,
            recipientLabel: "member",
          });
        } catch (error) {
          console.error("Viewing status notification failed:", error);
        }
      })();
    });

    revalidatePath("/agent/viewings");
  } catch (error) {
    console.error("Error updating viewing status:", error);
    throw new Error("Failed to update status");
  }
}
export async function getMemberViewings() {
  const sessionUser = await requireRole("CORP");
  try {
    const viewings = await prisma.viewing.findMany({
      where: { corpMemberId: sessionUser.id },
      include: { property: { select: { id: true, title: true, location: true, images: true, price: true, status: true } } },
      orderBy: { date: "asc" }
    });
    return viewings;
  } catch (error) {
    console.error("Error fetching member viewings:", error);
    return [];
  }
}

export async function cancelViewing(viewingId: string) {
  const safeViewingId = idSchema.parse(viewingId);
  const viewing = await prisma.viewing.findUnique({ where: { id: safeViewingId } });
  if (!viewing) throw new Error("Viewing not found");
  await requireOwnerOrAdmin(viewing.corpMemberId);
  try {
    await prisma.viewing.update({
      where: { id: safeViewingId },
      data: { status: "CANCELLED" }
    });
    revalidatePath("/member/history");
  } catch (error) {
    console.error("Error cancelling viewing:", error);
    throw new Error("Failed to cancel viewing");
  }
}
