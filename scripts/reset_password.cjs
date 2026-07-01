const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  const email = "bola1@aun.edu.ng";
  const newPassword = "11111111";
  
  console.log(`Hashing password for ${email}...`);
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  console.log(`Updating database...`);
  const user = await prisma.user.update({
    where: { email },
    data: { password: hashedPassword }
  });
  
  console.log(`Successfully reset password for user ${user.name} (${email})!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
