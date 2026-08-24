"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { prepareAuthLightMode } from "../../app/components/Auth/AuthTheme";

export function AgentTopBar() {
  return (
    <div className="hidden md:flex items-center justify-end px-6 py-3 bg-card border-b border-border shadow-sm shrink-0">
      <button
        onClick={() => { prepareAuthLightMode(); void signOut({ callbackUrl: "/signin" }); }}
        className="na-interactive na-focus-ring flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive border border-border hover:border-destructive/30"
      >
        <LogOut className="w-4 h-4" />
        Log Out
      </button>
    </div>
  );
}
