import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";

const prisma = new PrismaClient();

function validateTransportContent(jsonString) {
  const data = JSON.parse(jsonString);
  if (!data || typeof data !== "object") throw new Error("Invalid JSON root");
  if (!data.state || typeof data.state !== "string") throw new Error("Missing guide state");
  if (!Array.isArray(data.routes) || data.routes.length === 0) throw new Error("Missing routes array");
  
  for (const [i, r] of data.routes.entries()) {
    if (!r.from || !r.to || !r.mode) throw new Error(`Route ${i} missing from/to/mode`);
    if (typeof r.minFare !== "number" || typeof r.maxFare !== "number" || r.minFare > r.maxFare) {
      throw new Error(`Route ${i} has invalid fare range`);
    }
  }
  return data;
}

async function main() {
  const filePath = "/home/ubuntu/NYSC/data/transport/nigeria-fare-ranges.apr-2026.json";
  const rawContent = readFileSync(filePath, "utf-8");
  
  // Validate content structure
  const parsed = validateTransportContent(rawContent);
  console.log(`Validated nationwide transport guide: ${parsed.routes.length} routes across jurisdictions.`);

  const slug = "transport-guide-nigeria-nationwide";
  const title = "Nigeria Nationwide Transport Guide — All 36 States & FCT";
  const category = "TRANSPORT";

  // Also clean up any old narrow guides so only the comprehensive nationwide guide is shown
  await prisma.contentItem.deleteMany({
    where: {
      category: "TRANSPORT",
      slug: { not: slug },
    },
  });
  console.log("Cleaned up legacy narrow transport guides.");

  const existing = await prisma.contentItem.findUnique({ where: { slug } });

  if (existing) {
    await prisma.contentItem.update({
      where: { slug },
      data: {
        title,
        category,
        content: rawContent,
        published: true,
      },
    });
    console.log(`Updated existing nationwide transport guide content item (${slug}).`);
  } else {
    await prisma.contentItem.create({
      data: {
        slug,
        title,
        category,
        content: rawContent,
        published: true,
      },
    });
    console.log(`Created new nationwide transport guide content item (${slug}).`);
  }
}

main()
  .catch((error) => {
    console.error("Error seeding nationwide transport guide:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
