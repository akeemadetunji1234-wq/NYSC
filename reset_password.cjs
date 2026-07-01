const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = await prisma.user.update({
    where: { email: 'bola1@aun.edu.ng' },
    data: { password: hashedPassword },
  });
  console.log(`Successfully updated password for ${user.email}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
