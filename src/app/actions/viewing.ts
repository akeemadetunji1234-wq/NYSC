"use server";

import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";

export async function scheduleViewing(propertyId: string, corpMemberId: string, date: Date, time: string) {
  try {
    const viewing = await prisma.viewing.create({
      data: {
        propertyId,
        corpMemberId,
        date,
        time,
        status: "PENDING"
      }
    });

    revalidatePath("/agent/viewings");
    return viewing;
  } catch (error) {
    console.error("Error scheduling viewing:", error);
    throw new Error("Failed to schedule viewing");
  }
}

export async function getAgentViewings(agentId: string) {
  if (!agentId) return [];
  try {
    const viewings = await prisma.viewing.findMany({
      where: {
        property: { agentId }
      },
      include: {
        property: true,
        corpMember: true
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
  try {
    await prisma.viewing.update({
      where: { id: viewingId },
      data: { status }
    });
    revalidatePath("/agent/viewings");
  } catch (error) {
    console.error("Error updating viewing status:", error);
    throw new Error("Failed to update status");
  }
}
export async function getMemberViewings(corpMemberId: string) {
  if (!corpMemberId) return [];
  try {
    const viewings = await prisma.viewing.findMany({
      where: { corpMemberId },
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
