import { PrismaClient } from "@prisma/client";
import { isPublishableListing } from "../src/lib/listingQuality.ts";

const prisma = new PrismaClient();
const reason = "Automatically unpublished: the description was not readable, or the title did not match the selected state.";

try {
  const published = await prisma.property.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, title: true, description: true, state: true, location: true },
  });
  const badIds = published.filter((property) => !isPublishableListing(property)).map((property) => property.id);
  if (badIds.length === 0) {
    console.log("No low-quality published listings to unpublish.");
  } else {
    const result = await prisma.property.updateMany({
      where: { id: { in: badIds }, status: "PUBLISHED" },
      data: { status: "REJECTED", moderationReason: reason },
    });
    console.log(`Unpublished ${result.count} low-quality listing(s).`);
  }
} finally {
  await prisma.$disconnect();
}
