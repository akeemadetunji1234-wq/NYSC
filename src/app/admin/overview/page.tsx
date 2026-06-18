"use client";
import { PageTransition } from "../../../components/layout/PageTransition";
import { EmptyState } from "../../../components/shared/States";
import { LayoutDashboard } from "lucide-react";

export default function OverviewPage() {
  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-6xl mx-auto h-full flex items-center justify-center">
        <EmptyState 
          icon={LayoutDashboard}
          title="Overview Coming Soon"
          description="We are building out the master overview dashboard. Check back soon."
        />
      </div>
    </PageTransition>
  );
}
