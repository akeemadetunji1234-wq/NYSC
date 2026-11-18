import type { MetadataRoute } from "next";
import { prisma } from "../lib/prisma";
import { isPublishableListing } from "../lib/listingQuality";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://nysc-mu.vercel.app").replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/explore`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/signup`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/signin`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/faq`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/safety`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/terms`, changeFrequency: "yearly", priority: 0.3 },
  ];
  if (!process.env.DATABASE_URL) return staticRoutes;

  try {
    const listings = await prisma.property.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, updatedAt: true, title: true, description: true, state: true, location: true },
      orderBy: { updatedAt: "desc" },
      take: 10_000,
    });
    return [
      ...staticRoutes,
      ...listings.filter((listing) => isPublishableListing(listing)).map((listing) => ({
        url: `${siteUrl}/explore/${listing.id}`,
        lastModified: listing.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.7,
      })),
    ];
  } catch (error) {
    console.error("Sitemap listing query failed:", error);
    return staticRoutes;
  }
}

export const revalidate = 3600;
