const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

async function main() {
  const users = await prisma.user.findMany({
    where: {
      emailVerified: null,
      isBanned: false,
    },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`${apply ? "APPLY" : "DRY RUN"}: found ${users.length} eligible account(s) with missing emailVerified.`);

  for (const user of users) {
    console.log(`${user.email || "(no email)"}\t${user.role}\t${user.createdAt.toISOString()}`);
  }

  if (!apply) {
    console.log("DRY RUN ONLY: no database changes were made. Re-run with --apply to write these values.");
    return;
  }

  let updated = 0;
  for (const user of users) {
    const result = await prisma.user.updateMany({
      where: {
        id: user.id,
        emailVerified: null,
        isBanned: false,
      },
      data: { emailVerified: user.createdAt },
    });
    updated += result.count;
  }

  console.log(`APPLY COMPLETE: updated ${updated} of ${users.length} account(s).`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
