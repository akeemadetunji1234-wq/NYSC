const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function resetDb() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DB_RESET !== "true") {
    console.error("DANGER: Cannot reset production database without ALLOW_DB_RESET=true");
    process.exit(1);
  }

  console.log("Starting database reset...");

  try {
    // Delete all dependent data
    console.log("Deleting all Bookings...");
    await prisma.booking.deleteMany();

    console.log("Deleting all Viewings...");
    await prisma.viewing.deleteMany();

    console.log("Deleting all Messages...");
    await prisma.message.deleteMany();

    console.log("Deleting all Reviews...");
    await prisma.review.deleteMany();

    console.log("Deleting all SavedProperties...");
    await prisma.savedProperty.deleteMany();

    console.log("Deleting all Properties...");
    await prisma.property.deleteMany();

    // Finally, delete all users who are NOT ADMIN
    console.log("Deleting all non-Admin users...");
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        role: {
          not: "ADMIN"
        }
      }
    });

    console.log(`Successfully deleted ${deletedUsers.count} users.`);
    console.log("Database reset complete.");
  } catch (error) {
    console.error("Error resetting database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

resetDb();
