"use server";

import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { createNotification } from "../../lib/notificationService";
import { requireUser } from "../../lib/authGuard";
import { rateLimit } from "../../lib/rateLimit";

import { pusherServer } from "../../lib/pusher";

const CHAT_ENABLED = process.env.ENABLE_CHAT === "true";
function requireChatEnabled() {
  if (!CHAT_ENABLED) throw new Error("Direct messaging is disabled for launch");
}

export async function sendMessage(receiverId: string, content: string) {
  requireChatEnabled();
  const sessionUser = await requireUser();
  const senderId = sessionUser.id;
  const normalizedContent = typeof content === "string" ? content.trim() : "";
  if (!receiverId || receiverId.length > 100 || receiverId === senderId || normalizedContent.length === 0 || normalizedContent.length > 5000) {
    throw new Error("Invalid message");
  }
  const limit = await rateLimit(`message:${senderId}`, 30, 10 * 60 * 1000);
  if (!limit.success) throw new Error("Too many messages. Please try again later.");
  try {
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, role: true, isBanned: true },
    });
    if (!receiver || receiver.isBanned) throw new Error("Recipient is unavailable");

    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content: normalizedContent,
      },
      include: {
        sender: {
          select: { name: true, image: true, role: true }
        },
        receiver: {
          select: { role: true }
        }
      }
    });
    
    // Trigger DB Notification for Receiver
    const link = message.receiver.role === "AGENT" ? "/agent/messages" : "/member/messages";
    await createNotification(
      receiverId,
      "NEW_MESSAGE",
      `New Message from ${message.sender.name || 'User'}`,
      normalizedContent.substring(0, 60) + (normalizedContent.length > 60 ? "..." : ""),
      link
    );

    // Trigger real-time event to the receiver's private channel
    await pusherServer.trigger(`private-user-${receiverId}`, "new-message", message);
    // Also trigger to sender's channel so their UI updates instantly if open in another tab
    await pusherServer.trigger(`private-user-${senderId}`, "new-message", message);
    
    revalidatePath("/member/messages");
    revalidatePath("/agent/messages");
    return message;
  } catch (error) {
    console.error("Error sending message:", error);
    throw new Error("Failed to send message");
  }
}

export async function getConversation(otherUserId: string) {
  requireChatEnabled();
  const sessionUser = await requireUser();
  const userId = sessionUser.id;

  try {
    if (!otherUserId || otherUserId.length > 100 || otherUserId === userId) throw new Error("Invalid conversation");
    const otherUser = await prisma.user.findUnique({ where: { id: otherUserId }, select: { id: true, isBanned: true } });
    if (!otherUser || otherUser.isBanned) throw new Error("Conversation is unavailable");

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

export async function getConversationsList() {
  requireChatEnabled();
  const sessionUser = await requireUser();
  const userId = sessionUser.id;

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
