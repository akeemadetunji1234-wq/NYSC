"use client";
import { PageTransition } from "../../../components/layout/PageTransition";
import { EmptyState } from "../../../components/shared/States";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-6xl mx-auto h-full flex items-center justify-center">
        <EmptyState 
          icon={Settings}
          title="System Settings"
          description="Global platform configurations, API keys, and service toggles."
        />
      </div>
    </PageTransition>
  );
}
