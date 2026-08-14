const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_ADMIN_SETUP !== "true") {
    throw new Error("Refusing admin setup in production without ALLOW_ADMIN_SETUP=true");
  }

  const email = String(process.env.ADMIN_SETUP_EMAIL || "").trim().toLowerCase();
  const confirmEmail = String(process.env.ADMIN_SETUP_CONFIRM_EMAIL || "").trim().toLowerCase();
  const password = String(process.env.ADMIN_SETUP_PASSWORD || "");

  if (!email || email.length > 254 || email !== confirmEmail) {
    throw new Error("ADMIN_SETUP_EMAIL and ADMIN_SETUP_CONFIRM_EMAIL must match and be valid");
  }
  if (password.length < 12 || password.length > 128) {
    throw new Error("ADMIN_SETUP_PASSWORD must be between 12 and 128 characters");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await prisma.user.findUnique({ where: { email } });

  const admin = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: {
          role: "ADMIN",
          password: passwordHash,
          isBanned: false,
        },
        select: { id: true, email: true, role: true },
      })
    : await prisma.user.create({
        data: {
          email,
          name: process.env.ADMIN_SETUP_NAME || "Administrator",
          role: "ADMIN",
          password: passwordHash,
          isBanned: false,
        },
        select: { id: true, email: true, role: true },
      });

  console.log(`Admin account configured: ${admin.email} (${admin.role})`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
