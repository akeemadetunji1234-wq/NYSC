"use client";
import { PageTransition } from "../../../components/layout/PageTransition";
import { ListingBacklogGrid } from "../../../features/admin/ListingBacklogGrid";

export default function BacklogPage() {
  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Listing Backlog</h1>
          <p className="text-muted-foreground mt-1">Review and approve new apartment listings before they go live.</p>
        </div>
        <ListingBacklogGrid />
      </div>
    </PageTransition>
  );
}
