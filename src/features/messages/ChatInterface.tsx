"use client";

import { useState, useEffect, useRef } from "react";
import { Send, User as UserIcon } from "lucide-react";
import { Button } from "../../components/ui/button";
import { getConversation, sendMessage, getConversationsList } from "../../app/actions/messages";
import Image from "next/image";

export function ChatInterface({ currentUserId, defaultOtherUserId }: { currentUserId: string, defaultOtherUserId?: string }) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(defaultOtherUserId || null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations list
  useEffect(() => {
    async function loadConversations() {
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
    }
    loadConversations();
    
    // Auto-refresh periodically (primitive real-time)
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, [currentUserId, activeChatId]);

  // Load active chat messages
  useEffect(() => {
    if (!activeChatId) return;
    async function loadMessages() {
      try {
        const msgs = await getConversation(currentUserId, activeChatId);
        setMessages(msgs);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      } catch (error) {
        console.error(error);
      }
    }
    loadMessages();

    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
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
    return <div className="p-8 text-center text-slate-500">Loading messages...</div>;
  }

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Sidebar: Conversations List */}
      <div className={`w-full md:w-80 border-r border-slate-100 flex-shrink-0 flex flex-col ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h2 className="font-bold text-slate-900 text-lg">Messages</h2>
        </div>
        <div className="overflow-y-auto flex-1">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm">No messages yet.</div>
          ) : (
            conversations.map((convo) => (
              <button
                key={convo.user.id}
                onClick={() => setActiveChatId(convo.user.id)}
                className={`w-full text-left p-4 border-b border-slate-50 hover:bg-slate-50 transition flex items-center gap-3 ${activeChatId === convo.user.id ? 'bg-green-50/50' : ''}`}
              >
                <div className="relative w-12 h-12 bg-slate-100 rounded-full overflow-hidden flex-shrink-0">
                  {convo.user.image ? (
                    <Image src={convo.user.image} alt={convo.user.name || "User"} fill className="object-cover" />
                  ) : (
                    <UserIcon className="w-6 h-6 text-slate-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <p className="font-bold text-slate-900 truncate">{convo.user.name || "Unknown User"}</p>
                  </div>
                  <p className={`text-sm truncate ${convo.unreadCount > 0 ? 'font-bold text-slate-900' : 'text-slate-500'}`}>
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
            <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-white shadow-sm z-10">
              <button className="md:hidden text-[#008A4B] font-medium text-sm mr-2" onClick={() => setActiveChatId(null)}>
                ← Back
              </button>
              <div className="w-10 h-10 bg-slate-100 rounded-full overflow-hidden relative">
                 {activeUser?.image ? (
                    <Image src={activeUser.image} alt={activeUser.name || "User"} fill className="object-cover" />
                 ) : (
                    <UserIcon className="w-5 h-5 text-slate-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                 )}
              </div>
              <div>
                <p className="font-bold text-slate-900">{activeUser?.name || "User"}</p>
                <p className="text-xs text-green-600 font-medium">Active now</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50 space-y-4">
              {messages.map((msg) => {
                const isMe = msg.senderId === currentUserId;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 ${isMe ? 'bg-[#008A4B] text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-900 rounded-tl-sm shadow-sm'}`}>
                      <p className="text-sm md:text-base">{msg.content}</p>
                      <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-green-200' : 'text-slate-400'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-slate-100">
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
                />
                <Button type="submit" disabled={!newMessage.trim()} className="bg-[#008A4B] hover:bg-[#006F3C] text-white rounded-xl px-4 h-auto">
                  <Send className="w-5 h-5" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
               <Send className="w-8 h-8 text-slate-300" />
            </div>
            <p className="font-medium text-slate-500">Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
