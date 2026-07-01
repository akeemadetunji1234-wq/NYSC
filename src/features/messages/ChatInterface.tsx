"use client";

import { useState, useEffect, useRef } from "react";
import { Send, User as UserIcon } from "lucide-react";
import { Button } from "../../components/ui/button";
import { getConversation, sendMessage, getConversationsList } from "../../app/actions/messages";
import Image from "next/image";

import { getPusherClient } from "../../lib/pusher";

export function ChatInterface({ currentUserId, defaultOtherUserId }: { currentUserId: string, defaultOtherUserId?: string }) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(defaultOtherUserId || null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = async () => {
    try {
      const convos = await getConversationsList(currentUserId);
      setConversations(convos);
      if (!activeChatId && convos.length > 0) {
        setActiveChatId(convos[0].user.id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!activeChatId) return;
    try {
      const msgs = await getConversation(currentUserId, activeChatId);
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (error) {
      console.error(error);
    }
  };

  // Load conversations list once on mount or when currentUserId changes
  useEffect(() => {
    loadConversations();
  }, [currentUserId]);

  // Load messages whenever activeChatId changes
  useEffect(() => {
    loadMessages();
  }, [currentUserId, activeChatId]);

  // Real-time WebSockets (Pusher) Setup
  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return;

    const channelName = `user-${currentUserId}`;
    let channel = pusher.channels.channels[channelName];
    if (!channel) {
      channel = pusher.subscribe(channelName);
    }

    const handleNewMessage = () => {
      // Whenever a new message hits our channel, refresh the UI
      loadConversations();
      loadMessages();
    };

    channel.bind("new-message", handleNewMessage);

    return () => {
      channel.unbind("new-message", handleNewMessage);
    };
  }, [currentUserId, activeChatId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatId) return;

    const tempMessage = {
      id: "temp-" + Date.now(),
      content: newMessage,
      senderId: currentUserId,
      receiverId: activeChatId,
      createdAt: new Date(),
    };

    setMessages([...messages, tempMessage]);
    setNewMessage("");
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

    try {
      await sendMessage(currentUserId, activeChatId, tempMessage.content);
      const msgs = await getConversation(currentUserId, activeChatId);
      setMessages(msgs);
    } catch (error) {
      console.error("Failed to send", error);
    }
  };

  const activeUser = conversations.find(c => c.user.id === activeChatId)?.user;

  if (isLoading && conversations.length === 0 && !defaultOtherUserId) {
    return <div className="p-8 text-center text-muted-foreground">Loading messages...</div>;
  }

  return (
    <div className="flex h-[calc(100vh-140px)] bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
      {/* Sidebar: Conversations List */}
      <div className={`w-full md:w-80 border-r border-border flex-shrink-0 flex flex-col ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-border bg-secondary">
          <h2 className="font-bold text-foreground text-lg">Messages</h2>
        </div>
        <div className="overflow-y-auto flex-1">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">No messages yet.</div>
          ) : (
            conversations.map((convo) => (
              <button
                key={convo.user.id}
                onClick={() => setActiveChatId(convo.user.id)}
                className={`w-full text-left p-4 border-b border-slate-50 hover:bg-secondary transition flex items-center gap-3 ${activeChatId === convo.user.id ? 'bg-green-50/50' : ''}`}
              >
                <div className="relative w-12 h-12 bg-secondary rounded-full overflow-hidden flex-shrink-0">
                  {convo.user.image ? (
                    <Image src={convo.user.image} alt={convo.user.name || "User"} fill className="object-cover" />
                  ) : (
                    <UserIcon className="w-6 h-6 text-slate-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <p className="font-bold text-foreground truncate">{convo.user.name || "Unknown User"}</p>
                  </div>
                  <p className={`text-sm truncate ${convo.unreadCount > 0 ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                    {convo.lastMessage.content}
                  </p>
                </div>
                {convo.unreadCount > 0 && (
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                    {convo.unreadCount}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
        {activeChatId ? (
          <>
            <div className="p-4 border-b border-border flex items-center gap-3 bg-card shadow-sm z-10">
              <button className="md:hidden text-[#008A4B] font-medium text-sm mr-2" onClick={() => setActiveChatId(null)}>
                ← Back
              </button>
              <div className="w-10 h-10 bg-secondary rounded-full overflow-hidden relative">
                 {activeUser?.image ? (
                    <Image src={activeUser.image} alt={activeUser.name || "User"} fill className="object-cover" />
                 ) : (
                    <UserIcon className="w-5 h-5 text-slate-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                 )}
              </div>
              <div>
                <p className="font-bold text-foreground">{activeUser?.name || "User"}</p>
                <p className="text-xs text-green-600 font-medium">Active now</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50 space-y-4">
              {messages.map((msg, idx) => {
                const isMe = msg.senderId === currentUserId;
                const isLastMsg = idx === messages.length - 1;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${isMe ? 'bg-[#007AFF] text-white rounded-tr-sm' : 'bg-card border border-border text-foreground rounded-tl-sm'}`}>
                      <p className="text-[15px]">{msg.content}</p>
                    </div>
                    {isMe && isLastMsg ? (
                      <div className="text-[10px] text-slate-400 mt-1 mr-1 font-medium tracking-wide">
                        Delivered
                      </div>
                    ) : null}
                    {!isMe && (
                      <div className="text-[10px] text-slate-400 mt-1 ml-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-card border-t border-border">
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 bg-secondary border border-border rounded-xl focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
                />
                <Button type="submit" disabled={!newMessage.trim()} className="bg-[#008A4B] hover:bg-[#006F3C] text-white rounded-xl px-4 h-auto">
                  <Send className="w-5 h-5" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
               <Send className="w-8 h-8 text-slate-300" />
            </div>
            <p className="font-medium text-muted-foreground">Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
