"use server";

import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";

export async function createDispute(bookingId: string, reporterId: string, type: string, description: string) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { property: true }
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    const dispute = await prisma.dispute.create({
      data: {
        bookingId,
        reporterId,
        agentId: booking.property.agentId,
        type,
        description,
      }
    });

    revalidatePath("/member/history");
    return { success: true, dispute };
  } catch (error: any) {
    console.error("Failed to create dispute:", error);
    return { success: false, error: error.message };
  }
}

export async function getAdminDisputes() {
  try {
    const disputes = await prisma.dispute.findMany({
      include: {
        reporter: {
          select: { name: true, email: true }
        },
        agent: {
          select: { name: true, email: true }
        },
        booking: {
          include: {
            property: {
              select: { title: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return disputes.map(d => ({
      id: d.id,
      ticketNo: "TKT-" + d.id.substring(0, 5).toUpperCase(),
      reporter: d.reporter?.name || d.reporter?.email || "Unknown User",
      against: d.booking?.property?.title || "Unknown Property",
      agentName: d.agent?.name || d.agent?.email || "Unknown Agent",
      type: d.type,
      status: d.status,
      date: new Date(d.createdAt).toLocaleDateString(),
      priority: "High", // Real app could compute priority
      amount: d.booking?.amount || 0,
      feeStatus: d.booking?.feeStatus || "UNPAID",
      description: d.description,
      adminResponse: d.adminResponse,
      bookingId: d.bookingId
    }));
  } catch (error) {
    console.error("Failed to fetch disputes:", error);
    return [];
  }
}

export async function respondToDispute(disputeId: string, responseText: string, markResolved: boolean) {
  try {
    const updateData: any = {
      adminResponse: responseText,
    };
    
    if (markResolved) {
      updateData.status = "RESOLVED";
    }

    await prisma.dispute.update({
      where: { id: disputeId },
      data: updateData
    });

    revalidatePath("/admin/disputes");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to respond to dispute:", error);
    return { success: false, error: error.message };
  }
}
