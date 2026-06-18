"use client";
import { PageTransition } from "../../../components/layout/PageTransition";
import { UserManagementTable } from "../../../features/admin/UserManagementTable";

export default function UsersPage() {
  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500 mt-1">Search, filter, and manage all platform users.</p>
        </div>
        <UserManagementTable />
      </div>
    </PageTransition>
  );
}
