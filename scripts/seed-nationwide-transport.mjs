import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { parseTransportGuideContent } from "../src/lib/transport.ts";

const prisma = new PrismaClient();

async function main() {
  const filePath = "/home/ubuntu/NYSC/data/transport/nigeria-fare-ranges.apr-2026.json";
  const rawContent = readFileSync(filePath, "utf-8");
  
  // Validate content structure
  const parsed = parseTransportGuideContent(rawContent);
  console.log(`Validated nationwide transport guide: ${parsed.routes.length} routes across jurisdictions.`);

  const slug = "transport-guide-nigeria-nationwide";
  const title = "Nigeria Nationwide Transport Guide — All 36 States & FCT";
  const category = "TRANSPORT";

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
