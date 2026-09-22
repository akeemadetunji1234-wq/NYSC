"use server";

import { prisma } from "../../lib/prisma";

export type PublicMarketplaceStats = {
  listings: number;
  states: number;
  members: number;
  verifiedAgents: number;
};

export async function getPublicMarketplaceStats(): Promise<PublicMarketplaceStats> {
  try {
    const [listings, stateRows, members, verifiedAgents] = await Promise.all([
      prisma.property.count({ where: { status: "PUBLISHED" } }),
      prisma.property.findMany({
        where: { status: "PUBLISHED", state: { not: "" } },
        distinct: ["state"],
        select: { state: true },
      }),
      prisma.user.count({ where: { role: "CORP" } }),
      prisma.user.count({ where: { role: "AGENT", agentVerified: true } }),
    ]);

    return {
      listings,
      states: stateRows.length,
      members,
      verifiedAgents,
    };
  } catch (error) {
    console.error("Failed to load public marketplace stats", error);
    return { listings: 0, states: 0, members: 0, verifiedAgents: 0 };
  }
}
