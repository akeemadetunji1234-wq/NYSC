"use client";

import { PageTransition } from "../../../components/layout/PageTransition";
import { ChatInterface } from "../../../features/messages/ChatInterface";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useSession } from "next-auth/react";

function MessagesContent() {
  const searchParams = useSearchParams();
  const agentId = searchParams.get("agentId");
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  if (!userId) return <div className="p-8 text-center text-slate-500">Please log in to view messages.</div>;

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto p-4 md:p-8 pb-32 md:pb-8 h-screen">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Messages</h1>
          <p className="text-slate-500">Communicate securely with agents on CorperHome.</p>
        </div>
        <ChatInterface currentUserId={userId} defaultOtherUserId={agentId || undefined} />
      </div>
    </PageTransition>
  );
}

export default function MemberMessagesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <MessagesContent />
    </Suspense>
  );
}
