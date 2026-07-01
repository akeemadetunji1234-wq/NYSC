"use server";

import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";

// Ensure mock users exist
async function ensureUsersExist(userIds: string[]) {
  for (const id of userIds) {
    if (id.startsWith("mock-")) {
      const existing = await prisma.user.findUnique({ where: { id } });
      if (!existing) {
        await prisma.user.create({
          data: {
            id,
            name: id === "mock-corp-id" ? "Mock Corp Member" : "Mock Agent",
            email: `${id}@mock.com`,
            role: id === "mock-corp-id" ? "CORP" : "AGENT",
          }
        });
      }
    }
  }
}

import { pusherServer } from "../../lib/pusher";

export async function sendMessage(senderId: string, receiverId: string, content: string) {
  try {
    await ensureUsersExist([senderId, receiverId]);
    
    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
      },
      include: {
        sender: {
          select: { name: true, image: true, role: true }
        }
      }
    });
    
    // Trigger real-time event to the receiver's private channel
    await pusherServer.trigger(`user-${receiverId}`, "new-message", message);
    // Also trigger to sender's channel so their UI updates instantly if open in another tab
    await pusherServer.trigger(`user-${senderId}`, "new-message", message);
    
    revalidatePath("/member/messages");
    revalidatePath("/agent/messages");
    return message;
  } catch (error) {
    console.error("Error sending message:", error);
    throw new Error("Failed to send message");
  }
}

export async function getConversation(userId: string, otherUserId: string) {
  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ]
      },
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: { name: true, image: true, role: true }
        }
      }
    });

    // Mark messages as read
    const unreadIds = messages
      .filter(m => m.receiverId === userId && !m.read)
      .map(m => m.id);

    if (unreadIds.length > 0) {
      await prisma.message.updateMany({
        where: { id: { in: unreadIds } },
        data: { read: true }
      });
    }

    return messages;
  } catch (error) {
    console.error("Error fetching conversation:", error);
    throw new Error("Failed to fetch conversation");
  }
}

export async function getConversationsList(userId: string) {
  try {
    // Find all users this user has messaged with
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ]
      },
      orderBy: { createdAt: "desc" },
      include: {
        sender: { select: { id: true, name: true, image: true, role: true } },
        receiver: { select: { id: true, name: true, image: true, role: true } },
      }
    });

    const conversationMap = new Map();

    messages.forEach(msg => {
      const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;
      if (!conversationMap.has(otherUser.id)) {
        conversationMap.set(otherUser.id, {
          user: otherUser,
          lastMessage: msg,
          unreadCount: msg.receiverId === userId && !msg.read ? 1 : 0
        });
      } else {
        if (msg.receiverId === userId && !msg.read) {
          const entry = conversationMap.get(otherUser.id);
          entry.unreadCount += 1;
        }
      }
    });

    return Array.from(conversationMap.values());
  } catch (error) {
    console.error("Error fetching conversations list:", error);
    throw new Error("Failed to fetch conversations list");
  }
}
