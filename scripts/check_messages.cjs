const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function check() {
  const userId = "cmqs2vyns0000pcm3wp3n3cfq"; // Akeem
  const otherUserId = "cmqs0cmzk0002if3jzbu879ps"; // Bola Ahmed

  // Test getConversation logic
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ]
    },
    orderBy: { createdAt: "asc" },
  });
  console.log("getConversation output:", messages);

  // Test getConversationsList logic
  const allMessages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId },
        { receiverId: userId },
      ]
    },
    include: {
      sender: true,
      receiver: true
    }
  });
  console.log("getConversationsList input messages:", allMessages.map(m => ({
    id: m.id,
    senderId: m.senderId,
    receiverId: m.receiverId,
    senderName: m.sender.name,
    receiverName: m.receiver.name
  })));
}

check().catch(console.error).finally(() => prisma.$disconnect());
