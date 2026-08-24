import { prisma } from "./prisma";
import { createNotification } from "./notificationService";

export async function notifySavedSearchMatches(property: { id: string; title: string; state: string; lga?: string | null; price: number; bedrooms: number }) {
  const searches = await prisma.savedSearch.findMany({
    where: { active: true },
    select: { id: true, userId: true, name: true, state: true, lga: true, minPrice: true, maxPrice: true, bedrooms: true },
  });
  const matches = searches.filter((search) =>
    (!search.state || search.state.toLowerCase() === property.state.toLowerCase()) &&
    (!search.lga || search.lga.toLowerCase() === (property.lga || "").toLowerCase()) &&
    (search.minPrice == null || property.price >= search.minPrice) &&
    (search.maxPrice == null || property.price <= search.maxPrice) &&
    (search.bedrooms == null || property.bedrooms >= search.bedrooms),
  );
  await Promise.all(matches.map(async (search) => {
    await createNotification(
      search.userId,
      "NEW_MESSAGE",
      `New listing matches ${search.name}`,
      `${property.title} in ${property.state} matches one of your saved searches.`,
      `/member/listing/${property.id}`,
      {
        eventName: "saved-search:match",
        data: { searchId: search.id, propertyId: property.id, title: property.title },
      },
    );
  }));
  return matches.length;
}
