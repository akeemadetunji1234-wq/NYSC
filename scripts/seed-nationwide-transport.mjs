import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";

const prisma = new PrismaClient();

async function main() {
  const filePath = "/home/ubuntu/NYSC/data/transport/nigeria-fare-ranges.apr-2026.json";
  const rawContent = readFileSync(filePath, "utf-8");
  const data = JSON.parse(rawContent);

  if (!data || !Array.isArray(data.routes)) {
    throw new Error("Invalid transport JSON structure");
  }

  // Group routes by state
  const stateMap = {};
  for (const r of data.routes) {
    const stateName = r.state || "Unknown State";
    if (!stateMap[stateName]) {
      stateMap[stateName] = [];
    }
    stateMap[stateName].push(r);
  }

  const generatedSlugs = [];

  for (const [stateName, routes] of Object.entries(stateMap)) {
    const slug = `transport-guide-${stateName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const title = `${stateName} Transport Fare Guide`;
    const category = "TRANSPORT";
    
    const guidePayload = {
      state: stateName,
      description: `Current reference transport fare ranges for ${stateName} (within-city and intercity routes). Maintained by the Neat & Affordable team using NBS April 2026 data.`,
      currency: "NGN",
      routes,
    };

    const contentStr = JSON.stringify(guidePayload);

    await prisma.contentItem.upsert({
      where: { slug },
      update: {
        title,
        category,
        content: contentStr,
        published: true,
      },
      create: {
        slug,
        title,
        category,
        content: contentStr,
        published: true,
      },
    });

    generatedSlugs.push(slug);
    console.log(`Seeded transport guide for: ${stateName} (${slug})`);
  }

  // Clean up any legacy guides that are not part of the new 37 state guides
  await prisma.contentItem.deleteMany({
    where: {
      category: "TRANSPORT",
      slug: { notIn: generatedSlugs },
    },
  });
  console.log(`Cleaned up legacy transport guides. Total active state guides: ${generatedSlugs.length}.`);
}

main()
  .catch((error) => {
    console.error("Error seeding state transport guides:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
