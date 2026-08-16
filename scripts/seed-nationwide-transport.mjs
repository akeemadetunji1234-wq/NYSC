import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const sourcePath = fileURLToPath(new URL("../data/transport/nigeria-fare-ranges.apr-2026.json", import.meta.url));
const EXPECTED_JURISDICTIONS = 37;

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  const data = JSON.parse(readFileSync(sourcePath, "utf8"));

  if (!data || !Array.isArray(data.routes) || data.routes.length === 0) {
    throw new Error("Invalid transport JSON structure: routes must be a non-empty array");
  }

  const stateMap = new Map();
  for (const route of data.routes) {
    if (!route || typeof route.state !== "string" || !route.state.trim()) {
      throw new Error("Invalid transport route: every route must include a state");
    }
    const stateName = route.state.trim();
    const routes = stateMap.get(stateName) ?? [];
    routes.push(route);
    stateMap.set(stateName, routes);
  }

  if (stateMap.size !== EXPECTED_JURISDICTIONS) {
    throw new Error(`Expected ${EXPECTED_JURISDICTIONS} jurisdictions, found ${stateMap.size}`);
  }

  const generatedSlugs = [];
  for (const [stateName, routes] of [...stateMap.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const slug = `transport-guide-${slugify(stateName)}`;
    const content = JSON.stringify({
      state: stateName,
      description: `Current reference transport fare ranges for ${stateName} (within-city and intercity routes). Maintained by the Neat & Affordable team using NBS April 2026 data.`,
      currency: "NGN",
      routes,
    });

    await prisma.contentItem.upsert({
      where: { slug },
      update: {
        title: `${stateName} Transport Fare Guide`,
        category: "TRANSPORT",
        content,
        published: true,
      },
      create: {
        slug,
        title: `${stateName} Transport Fare Guide`,
        category: "TRANSPORT",
        content,
        published: true,
      },
    });

    generatedSlugs.push(slug);
  }

  const removed = await prisma.contentItem.deleteMany({
    where: {
      category: "TRANSPORT",
      slug: { notIn: generatedSlugs },
    },
  });

  const publishedCount = await prisma.contentItem.count({
    where: { category: "TRANSPORT", published: true },
  });

  if (publishedCount !== EXPECTED_JURISDICTIONS) {
    throw new Error(`Transport seed verification failed: expected ${EXPECTED_JURISDICTIONS} published guides, found ${publishedCount}`);
  }

  console.log(`Seeded and verified ${publishedCount} transport guides from ${data.routes.length} routes; removed ${removed.count} legacy records.`);
}

main()
  .catch((error) => {
    console.error("Error seeding nationwide transport guides:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
