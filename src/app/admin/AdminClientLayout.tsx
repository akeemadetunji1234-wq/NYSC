"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AdminSidebar } from "../../components/layout/AdminSidebar";
import { ThemeProvider } from "../../components/ThemeProvider";
import { prepareAuthLightMode } from "../components/Auth/AuthTheme";

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
      <div className="na-shell min-h-screen flex items-center justify-center">
        <p className="text-slate-400 text-sm animate-pulse">Verifying admin access...</p>
      </div>
    );
  }

  if (!session || role !== "ADMIN") return null;

  return (
    <ThemeProvider>
      <div className="na-shell min-h-screen flex flex-col md:flex-row">
        <AdminSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Admin top bar with logout */}
          <div className="hidden md:flex items-center justify-end px-6 py-3 bg-card border-b border-border shadow-sm shrink-0">
            <button
              onClick={() => {
                prepareAuthLightMode();
                void signOut({ callbackUrl: "/signin" });
              }}
              className="na-interactive na-focus-ring flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive border border-border hover:border-destructive/30"
            >
              <span className="text-xs">Log Out</span>
            </button>
          </div>
          <main className="na-enter flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
