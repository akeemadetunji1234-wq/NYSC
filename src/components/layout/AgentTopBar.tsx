"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function AgentTopBar() {
  return (
    <div className="hidden md:flex items-center justify-end px-6 py-3 bg-white border-b border-slate-100 shadow-sm shrink-0">
      <button
        onClick={() => signOut({ callbackUrl: "/signin" })}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600 border border-slate-200 hover:border-red-200 transition-all duration-200"
      >
        <LogOut className="w-4 h-4" />
        Log Out
      </button>
    </div>
  );
}
