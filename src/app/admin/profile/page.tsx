"use client";
import { PageTransition } from "../../../components/layout/PageTransition";
import { EmptyState } from "../../../components/shared/States";
import { UserCircle } from "lucide-react";

export default function ProfilePage() {
  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-6xl mx-auto h-full flex items-center justify-center">
        <EmptyState 
          icon={UserCircle}
          title="My Profile"
          description="Manage your admin account details, 2FA, and notification preferences."
        />
      </div>
    </PageTransition>
  );
}
