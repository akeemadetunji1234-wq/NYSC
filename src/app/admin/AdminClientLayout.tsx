"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AdminSidebar } from "../../components/layout/AdminSidebar";

export default function AdminClientLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const role = (session?.user as any)?.role;

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/signin");
      return;
    }
    if (role && role !== "ADMIN") {
      router.replace("/member"); // non-admins bounce to member area
    }
  }, [status, role, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-slate-400 text-sm animate-pulse">Verifying admin access...</p>
      </div>
    );
  }

  if (!session || role !== "ADMIN") return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Admin top bar with logout */}
        <div className="hidden md:flex items-center justify-end px-6 py-3 bg-white border-b border-slate-100 shadow-sm shrink-0">
          <button
            onClick={() => signOut({ callbackUrl: "/signin" })}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600 border border-slate-200 hover:border-red-200 transition-all duration-200"
          >
            <span className="text-xs">Log Out</span>
          </button>
        </div>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
