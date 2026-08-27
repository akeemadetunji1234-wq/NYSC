import { PrismaClient } from "@prisma/client";
import { notifySavedSearchMatches } from "../src/lib/savedSearchNotifications.ts";

const prisma = new PrismaClient();
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
let userId: string | undefined;
let propertyId: string | undefined;

try {
  const user = await prisma.user.create({
    data: { email: `saved-search-${suffix}@example.test`, name: "Saved Search Test", role: "CORP", isPremium: true, premiumPlan: "CORP_PREMIUM", operatingStates: [] },
  });
  userId = user.id;
  const property = await prisma.property.create({
    data: { title: "Saved Search Test Lodge", description: "Disposable fixture", location: "Ibadan", state: "Oyo", lga: "Ibadan North", price: 300000, bedrooms: 2, bathrooms: 1, amenities: [], images: [], status: "PUBLISHED", agentId: user.id },
  });
  propertyId = property.id;
  const search = await prisma.savedSearch.create({
    data: { userId: user.id, name: "Quiet test search", state: "Oyo", lga: "Ibadan North", emailAlerts: false },
  });

  await notifySavedSearchMatches(property);
  const optedOutNotification = await prisma.notification.findFirst({ where: { userId: user.id, dedupeKey: `saved-search:${search.id}:property:${property.id}` } });
  if (!optedOutNotification || optedOutNotification.emailDeliveryAttempts !== 0 || optedOutNotification.emailDeliveredAt) throw new Error("Email opt-out did not suppress delivery");

  await prisma.savedSearch.update({ where: { id: search.id }, data: { emailAlerts: true } });
  const secondProperty = await prisma.property.create({
    data: { title: "Saved Search Test Lodge Two", description: "Disposable fixture", location: "Ibadan", state: "Oyo", lga: "Ibadan North", price: 310000, bedrooms: 2, bathrooms: 1, amenities: [], images: [], status: "PUBLISHED", agentId: user.id },
  });
  await notifySavedSearchMatches(secondProperty);
  const optedInNotification = await prisma.notification.findFirst({ where: { userId: user.id, dedupeKey: `saved-search:${search.id}:property:${secondProperty.id}` } });
  if (!optedInNotification || optedInNotification.emailDeliveryAttempts !== 1 || !optedInNotification.emailDeliveredAt || optedInNotification.lastEmailError) throw new Error("Email opt-in did not record mock delivery");

  console.log(JSON.stringify({ ok: true, checks: ["email opt-out suppresses delivery", "email opt-in records one mock attempt and deliveredAt"] }, null, 2));
  await prisma.property.delete({ where: { id: secondProperty.id } });
} finally {
  if (propertyId) await prisma.property.deleteMany({ where: { id: propertyId } });
  if (userId) {
    await prisma.savedSearch.deleteMany({ where: { userId } });
    await prisma.notification.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } }).catch(() => undefined);
  }
  await prisma.$disconnect();
}
