"use server";

import { prisma } from "../../lib/prisma";
import { isPublishableListing } from "../../lib/listingQuality";

export type PublicMarketplaceStats = {
  listings: number;
  states: number;
  members: number;
  verifiedAgents: number;
};

export async function getPublicMarketplaceStats(): Promise<PublicMarketplaceStats> {
  try {
    const [published, members, verifiedAgents] = await Promise.all([
      prisma.property.findMany({
        where: { status: "PUBLISHED" },
        select: { state: true, title: true, description: true, location: true },
      }),
      prisma.user.count({ where: { role: "CORP" } }),
      prisma.user.count({ where: { role: "AGENT", agentVerified: true } }),
    ]);
    const visible = published.filter((property) => isPublishableListing(property));
    const states = new Set(visible.map((property) => property.state).filter(Boolean));

    return {
      listings: visible.length,
      states: states.size,
      members,
      verifiedAgents,
    };
  } catch (error) {
    console.error("Failed to load public marketplace stats", error);
    return { listings: 0, states: 0, members: 0, verifiedAgents: 0 };
  }
}
