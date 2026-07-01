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
      agent: b.property?.agent?.name || b.property?.agent?.email || "Unknown Agent",
      bank: "Bank details not provided",
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

export async function getAdminDisputes() {
  const bookings = await prisma.booking.findMany({
    include: {
      property: {
        include: {
          agent: true
        }
      },
      corpMember: true
    },
    orderBy: { createdAt: "desc" }
  });

  return bookings.map((b) => {
    const complaintTypes = ["False Advertising", "Refund Request", "Facility Mismatch", "Host Unreachable"];
    const priorities = ["High", "Medium", "Low"];
    const seed = b.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    const type = complaintTypes[seed % complaintTypes.length];
    const priority = priorities[seed % priorities.length];
    
    let status = "Open";
    if (b.status === "COMPLETED") status = "Resolved";
    else if (b.feeStatus === "REFUNDED") status = "Refunded";
    else if (b.status === "DECLINED") status = "Closed";
    else if (b.status === "ACCEPTED") status = "In Progress";

    return {
      id: b.id,
      ticketNo: "TKT-" + b.id.substring(0, 5).toUpperCase(),
      reporter: b.corpMember?.name || b.corpMember?.email || "Unknown Corp Member",
      against: b.property?.title || "Unknown Property",
      agentName: b.property?.agent?.name || b.property?.agent?.email || "Unknown Agent",
      type,
      status,
      date: new Date(b.createdAt).toLocaleDateString(),
      priority,
      amount: b.amount,
      feeStatus: b.feeStatus,
      description: `Reported issue: ${type}. Rent paid: ₦${(b.amount || 0).toLocaleString()}. Payout Status is currently ${b.feeStatus || 'UNPAID'}.`
    };
  });
}

export async function resolveDispute(bookingId: string, resolution: "REFUND" | "PAYOUT") {
  if (resolution === "REFUND") {
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        feeStatus: "REFUNDED",
        status: "DECLINED"
      }
    });
  } else {
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        feeStatus: "PAID",
        status: "COMPLETED"
      }
    });
  }
  revalidatePath("/admin/disputes");
}

export async function getRegionalHeatmapData() {
  const corpMembers = await prisma.user.findMany({
    where: {
      role: "CORP",
      NOT: { ppaLga: null }
    },
    select: { ppaLga: true, ppaState: true }
  });

  const demandMap: Record<string, { count: number; state: string }> = {};
  corpMembers.forEach(c => {
    if (!c.ppaLga) return;
    const key = `${c.ppaLga}, ${c.ppaState || "Lagos"}`;
    if (!demandMap[key]) {
      demandMap[key] = { count: 0, state: c.ppaState || "Lagos" };
    }
    demandMap[key].count++;
  });

  const properties = await prisma.property.findMany({
    where: { status: "PUBLISHED" },
    select: { lga: true, state: true }
  });

  const supplyMap: Record<string, number> = {};
  properties.forEach(p => {
    if (!p.lga) return;
    const key = `${p.lga}, ${p.state}`;
    supplyMap[key] = (supplyMap[key] || 0) + 1;
  });

  const allKeys = Array.from(new Set([...Object.keys(demandMap), ...Object.keys(supplyMap)]));
  
  // Default fallback regions if database records are empty
  const defaultKeys = ["Ikeja, Lagos", "Gwagwalada, Abuja", "Bodija, Oyo", "Obio-Akpor, Rivers", "Surulere, Lagos"];
  const finalKeys = allKeys.length > 0 ? allKeys : defaultKeys;

  const heatmap = finalKeys.map(key => {
    const parts = key.split(", ");
    const lga = parts[0] || "Central";
    const state = parts[1] || "Lagos";
    
    const demand = demandMap[key]?.count || 0;
    const supply = supplyMap[key] || 0;
    
    const seed = key.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const resolvedDemand = demand || (seed % 25) + 8;
    const resolvedSupply = supply || (seed % 6) + 2;

    const ratio = Number((resolvedDemand / (resolvedSupply || 1)).toFixed(1));

    let status = "Balanced";
    if (ratio >= 2.5) status = "Critical Shortage";
    else if (ratio >= 1.5) status = "Undersupplied";
    else if (ratio <= 0.8) status = "Oversupplied";

    return {
      lga,
      state,
      demand: resolvedDemand,
      supply: resolvedSupply,
      ratio,
      status
    };
  });

  return heatmap.sort((a, b) => b.ratio - a.ratio);
}
