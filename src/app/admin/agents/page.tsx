"use client";

import { UserManagementTable } from "../../../features/admin/UserManagementTable";

export default function AdminAgentsPage() {
  return (
    <div className="p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Agents & Hosts</h1>
        <p className="text-muted-foreground mt-1">Manage platform agents and property hosts.</p>
      </div>

      <UserManagementTable userRole="AGENT" />
    </div>
  );
}
