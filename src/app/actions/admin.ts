"use server";

import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";

export async function getDashboardStats() {
  const users = await prisma.user.count();
  const agents = await prisma.user.count({ where: { role: "AGENT" } });
  const pendingAgents = await prisma.user.count({ where: { role: "AGENT", agentVerified: false } });
  const properties = await prisma.property.count();
  const activeBookings = await prisma.booking.count({ where: { status: { in: ["PENDING", "ACCEPTED"] } } });

  return {
    users,
    agents,
    pendingAgents,
    properties,
    activeBookings
  };
}

export async function getAgents() {
  const agents = await prisma.user.findMany({
    where: { role: "AGENT" },
    orderBy: { agentVerified: "asc" }, // Pending first
    include: {
      _count: {
        select: { properties: true }
      }
    }
  });

  return agents;
}

export async function getUnverifiedAgents() {
  const agents = await prisma.user.findMany({
    where: { role: "AGENT", agentVerified: false }
  });
  return agents;
}

export async function verifyAgent(agentId: string, verify: boolean = true) {
  await prisma.user.update({
    where: { id: agentId },
    data: { agentVerified: verify }
  });

  revalidatePath("/admin/agents");
}

export async function getAllUsers() {
  const users = await prisma.user.findMany({
    orderBy: { email: "asc" }
  });
  return users;
}

export async function getPayouts() {
  // Since we don't have a Payout model, we calculate mock payouts from bookings that are PAID.
  const bookings = await prisma.booking.findMany({
    where: { feeStatus: "PAID" },
    include: {
      property: {
        include: {
          agent: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });
  
  // Transform bookings into payouts for the UI
  return bookings.map(b => {
    return {
      id: "PAY-" + b.id.substring(0, 8).toUpperCase(),
      agent: b.property.agent.name || b.property.agent.email,
      bank: "Bank details not provided", // We don't have bank details in User model right now
      amount: `₦${(b.amount * 0.95).toLocaleString()}`, // Assume 5% platform fee
      date: new Date(b.createdAt).toLocaleDateString(),
      status: "Pending" // For demo purposes, all new paid bookings need payout
    }
  });
}

export async function updateUserRole(userId: string, newRole: "ADMIN" | "AGENT" | "CORP") {
  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole }
  });
  revalidatePath("/admin/users");
}

export async function toggleUserBan(userId: string, isBanned: boolean) {
  await prisma.user.update({
    where: { id: userId },
    data: { isBanned }
  });
  revalidatePath("/admin/users");
}

export async function deleteUserAccount(userId: string) {
  await prisma.user.delete({
    where: { id: userId }
  });
  revalidatePath("/admin/users");
}
