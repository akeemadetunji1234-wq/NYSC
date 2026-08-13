"use server";

import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { createNotification } from "../../lib/notificationService";
import { requireUser, requireRole, requireOwnerOrAdmin } from "../../lib/authGuard";

export async function scheduleViewing(propertyId: string, date: Date, time: string) {
  const user = await requireRole("CORP");
  if (!(date instanceof Date) || Number.isNaN(date.getTime()) || !time || time.length > 50) {
    throw new Error("Invalid viewing date or time");
  }
  const corpMemberId = user.id;
  try {
    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property || property.status !== "PUBLISHED") throw new Error("Property is not available");

    const viewing = await prisma.viewing.create({
      data: {
        propertyId,
        corpMemberId,
        date,
        time,
        status: "PENDING"
      }
    });

    if (property) {
      await createNotification(
        property.agentId,
        "VIEWING_UPDATE",
        "New Viewing Scheduled",
        `A new viewing was scheduled for ${property.title}.`,
        "/agent/viewings"
      );
    }

    revalidatePath("/agent/viewings");
    return viewing;
  } catch (error) {
    console.error("Error scheduling viewing:", error);
    throw new Error("Failed to schedule viewing");
  }
}

export async function getAgentViewings(agentId: string) {
  const sessionUser = await requireUser();
  if (sessionUser.role !== "ADMIN" && (sessionUser.role !== "AGENT" || sessionUser.id !== agentId)) {
    throw new Error("Forbidden");
  }
  if (!agentId) return [];
  try {
    const viewings = await prisma.viewing.findMany({
      where: {
        property: { agentId }
      },
      include: {
        property: true,
        corpMember: {
          select: { id: true, name: true, email: true, phone: true, whatsapp: true, batch: true, image: true }
        }
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
  const sessionUser = await requireRole(["AGENT", "ADMIN"]);
  try {
    const existingViewing = await prisma.viewing.findUnique({
      where: { id: viewingId },
      include: { property: true },
    });
    if (!existingViewing) throw new Error("Viewing not found");
    if (sessionUser.role !== "ADMIN" && existingViewing.property.agentId !== sessionUser.id) {
      throw new Error("Forbidden");
    }

    const viewing = await prisma.viewing.update({
      where: { id: viewingId },
      data: { status },
      include: { property: true }
    });

    await createNotification(
      viewing.corpMemberId,
      "VIEWING_UPDATE",
      `Viewing ${status}`,
      `Your viewing for ${viewing.property.title} is now ${status}.`,
      "/member/history"
    );

    revalidatePath("/agent/viewings");
  } catch (error) {
    console.error("Error updating viewing status:", error);
    throw new Error("Failed to update status");
  }
}
export async function getMemberViewings(corpMemberId: string) {
  const sessionUser = await requireUser();
  if (sessionUser.id !== corpMemberId) throw new Error("Forbidden");
  if (!corpMemberId) return [];
  try {
    const viewings = await prisma.viewing.findMany({
      where: { corpMemberId: sessionUser.id },
      include: { property: true },
      orderBy: { date: "asc" }
    });
    return viewings;
  } catch (error) {
    console.error("Error fetching member viewings:", error);
    return [];
  }
}

export async function cancelViewing(viewingId: string) {
  const viewing = await prisma.viewing.findUnique({ where: { id: viewingId } });
  if (!viewing) throw new Error("Viewing not found");
  await requireOwnerOrAdmin(viewing.corpMemberId);
  try {
    await prisma.viewing.update({
      where: { id: viewingId },
      data: { status: "CANCELLED" }
    });
    revalidatePath("/member/history");
  } catch (error) {
    console.error("Error cancelling viewing:", error);
    throw new Error("Failed to cancel viewing");
  }
}
