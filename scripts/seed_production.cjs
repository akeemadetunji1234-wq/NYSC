const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  console.log("Starting high-fidelity database seed...");

  // 1. Clean database
  console.log("Clearing existing data...");
  await prisma.booking.deleteMany();
  await prisma.viewing.deleteMany();
  await prisma.message.deleteMany();
  await prisma.review.deleteMany();
  await prisma.savedProperty.deleteMany();
  await prisma.property.deleteMany();
  
  // Note: Delete all non-admin, non-akeem users to clear raw placeholder users
  await prisma.user.deleteMany({
    where: {
      role: { not: "ADMIN" },
      email: { not: "akeemadetunji1234@gmail.com" }
    }
  });

  // 2. Create or upsert Admin
  const adminPassword = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@campstay.ng" },
    update: {},
    create: {
      email: "admin@campstay.ng",
      name: "Super Admin",
      role: "ADMIN",
      password: adminPassword
    }
  });

  // 3. Create or upsert Akeem (Corp Member)
  console.log("Setting up Akeem's account...");
  const userPassword = await bcrypt.hash("password123", 10);
  const akeem = await prisma.user.upsert({
    where: { email: "akeemadetunji1234@gmail.com" },
    update: {
      name: "AKEEM ADETUNJI",
      role: "CORP",
      ppaState: "Benue",
      ppaLga: "Gboko",
      ppaLatitude: 7.3276,
      ppaLongitude: 8.9958,
      phone: "+234 812 345 6789",
      batch: "Batch A 2026"
    },
    create: {
      email: "akeemadetunji1234@gmail.com",
      name: "AKEEM ADETUNJI",
      role: "CORP",
      password: userPassword,
      ppaState: "Benue",
      ppaLga: "Gboko",
      ppaLatitude: 7.3276,
      ppaLongitude: 8.9958,
      phone: "+234 812 345 6789",
      batch: "Batch A 2026"
    }
  });

  // 4. Create Agents
  console.log("Seeding verified and unverified agents...");
  const agentPassword = await bcrypt.hash("agent123", 10);
  const bola = await prisma.user.upsert({
    where: { email: "bola1@aun.edu.ng" },
    update: { agentVerified: true },
    create: {
      email: "bola1@aun.edu.ng",
      name: "Bola Ahmed",
      role: "AGENT",
      password: agentPassword,
      agentVerified: true
    }
  });

  const chinedu = await prisma.user.upsert({
    where: { email: "chinedu@campstay.ng" },
    update: { agentVerified: false },
    create: {
      email: "chinedu@campstay.ng",
      name: "Chinedu Okafor",
      role: "AGENT",
      password: agentPassword,
      agentVerified: false
    }
  });

  // 5. Seed realistic properties
  console.log("Seeding premium NYSC properties...");
  const p1 = await prisma.property.create({
    data: {
      title: "Silver Heights 1-Bedroom Lodge",
      description: "A gorgeous modern one-bedroom self-contain located in a secure gated estate in Gboko. Perfect for serving corp members, featuring stable power supply, concrete running water, and 24/7 security. Just a 10-minute commute to the LGA Secretariat.",
      state: "Benue",
      lga: "Gboko",
      location: "8 Bolajoko Estate, Gboko",
      price: 150000,
      bedrooms: 1,
      bathrooms: 1,
      latitude: 7.3320,
      longitude: 8.9890,
      amenities: ["electricity", "water", "security"],
      images: ["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600"],
      status: "PUBLISHED",
      agentId: bola.id
    }
  });

  const p2 = await prisma.property.create({
    data: {
      title: "Executive Studio Apartment",
      description: "A premium studio apartment fully furnished with a study table, modern wardrobe, standing fan, and kitchenette. Excellent proximity to the Makurdi LGA Secretariat and Federal Medical Center. Highly demand area.",
      state: "Benue",
      lga: "Makurdi",
      location: "AIT Road, Makurdi",
      price: 180000,
      bedrooms: 1,
      bathrooms: 1,
      latitude: 7.7337,
      longitude: 8.5214,
      amenities: ["electricity", "water", "furnished", "parking"],
      images: ["https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600"],
      status: "PUBLISHED",
      agentId: bola.id
    }
  });

  const p3 = await prisma.property.create({
    data: {
      title: "Ikeja Corper Haven",
      description: "A comfortable self-contain lodge on Allen Avenue in the heart of Ikeja. Ideal for corp members posted to Lagos LGA Secretariats or nearby PPA companies. Gated entrance, dedicated prepaid meter, water treatment plant.",
      state: "Lagos",
      lga: "Ikeja",
      location: "12 Allen Avenue, Ikeja",
      price: 250000,
      bedrooms: 1,
      bathrooms: 1,
      latitude: 6.5967,
      longitude: 3.3532,
      amenities: ["electricity", "water", "security", "furnished"],
      images: ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600"],
      status: "PUBLISHED",
      agentId: chinedu.id
    }
  });

  const p4 = await prisma.property.create({
    data: {
      title: "Gwagwalada Double Room Lodge",
      description: "Spacious double room apartment designed for two sharing corp members. Located close to the NYSC Gwagwalada Secretariat and Abuja University campus. Fully fenced with ample car parking space.",
      state: "FCT",
      lga: "Gwagwalada",
      location: "Lokoja Road, Gwagwalada",
      price: 120000,
      bedrooms: 2,
      bathrooms: 1,
      latitude: 8.9515,
      longitude: 7.0771,
      amenities: ["water", "parking"],
      images: ["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600"],
      status: "PUBLISHED",
      agentId: bola.id
    }
  });

  // 6. Seed bookings
  console.log("Seeding bookings...");
  await prisma.booking.create({
    data: {
      propertyId: p1.id,
      corpMemberId: akeem.id,
      date: new Date(),
      time: "12:00",
      amount: p1.price,
      status: "PENDING",
      feeStatus: "UNPAID"
    }
  });

  await prisma.booking.create({
    data: {
      propertyId: p2.id,
      corpMemberId: akeem.id,
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      time: "14:00",
      amount: p2.price,
      status: "COMPLETED",
      feeStatus: "PAID"
    }
  });

  // 7. Seed reviews
  console.log("Seeding reviews...");
  await prisma.review.create({
    data: {
      propertyId: p1.id,
      corpMemberId: akeem.id,
      rating: 5,
      comment: "This lodge is absolutely beautiful! Bola was a super helpful agent."
    }
  });

  // 8. Seed messages
  console.log("Seeding messages...");
  const chatData = [
    { senderId: akeem.id, receiverId: bola.id, content: "hello" },
    { senderId: akeem.id, receiverId: bola.id, content: "is the peroprty avaliable" },
    { senderId: akeem.id, receiverId: bola.id, content: "Good morning" },
    { senderId: bola.id, receiverId: akeem.id, content: "how are you sir" },
  ];

  for (const msg of chatData) {
    await prisma.message.create({
      data: {
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        content: msg.content,
        read: true
      }
    });
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
