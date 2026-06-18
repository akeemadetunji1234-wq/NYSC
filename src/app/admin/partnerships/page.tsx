"use client";
import { PageTransition } from "../../../components/layout/PageTransition";
import { EmptyState } from "../../../components/shared/States";
import { Handshake } from "lucide-react";

export default function PartnershipsPage() {
  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-6xl mx-auto h-full flex items-center justify-center">
        <EmptyState 
          icon={Handshake}
          title="Partnerships"
          description="Manage B2B contracts, revenue sharing, and affiliate partners."
        />
      </div>
    </PageTransition>
  );
}
