"use client";

import { PageTransition } from "../../../components/layout/PageTransition";
import { ChatInterface } from "../../../features/messages/ChatInterface";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Suspense } from "react";

function MessagesContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const userId = searchParams.get("userId");
  const agentId = (session?.user as any)?.id;

  return (
    <PageTransition>
      <div className="space-y-6 h-[calc(100vh-6rem)]">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Inbox</h1>
          <p className="text-muted-foreground">Respond to inquiries from Corp Members.</p>
        </div>
        {agentId ? (
          <ChatInterface currentUserId={agentId} defaultOtherUserId={userId || undefined} />
        ) : (
          <div className="p-8 text-center text-muted-foreground">Loading your inbox...</div>
        )}
      </div>
    </PageTransition>
  );
}

export default function AgentMessagesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <MessagesContent />
    </Suspense>
  );
}
