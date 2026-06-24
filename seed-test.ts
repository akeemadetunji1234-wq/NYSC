import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  const agentId = "mock-agent-id";
  
  // Get an existing property for this agent
  const property = await prisma.property.findFirst({
    where: { agentId }
  });

  if (!property) {
    console.log("No properties found for agent, please create one first.");
    return;
  }

  // Create a mock corp member user
  const corp = await prisma.user.upsert({
    where: { id: "mock-corp-member" },
    update: {},
    create: {
      id: "mock-corp-member",
      name: "Tunde Olayinka",
      email: "tunde@nysc.com",
      role: "CORP"
    }
  });

  // Create a booking
  await prisma.booking.create({
    data: {
      propertyId: property.id,
      corpMemberId: corp.id,
      date: new Date(),
      time: "14:00",
      amount: property.price,
      status: "PENDING",
      feeStatus: "UNPAID"
    }
  });

  // Create a review
  await prisma.review.create({
    data: {
      propertyId: property.id,
      corpMemberId: corp.id,
      rating: 5,
      comment: "Absolutely amazing stay! Highly recommended for NYSC members.",
    }
  });

  console.log("Seeded a mock booking and review!");
}

seed().catch(console.error).finally(() => prisma.$disconnect());
