"use client";

import {
  LayoutDashboard,
  Home,
  CalendarCheck,
  Wallet,
  Star,
  Settings,
  Menu,
  X,
  MessageSquare,
  Eye,
} from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "../ui/button";
import { LogOut } from "lucide-react";
import { ThemeToggle } from "../ThemeToggle";

export function AgentSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  const user = session?.user as any;
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "A";

  const navItems = [
    { id: "/agent", label: "Overview", icon: LayoutDashboard },
    { id: "/agent/properties", label: "My Properties", icon: Home },
    { id: "/agent/bookings", label: "Bookings", icon: CalendarCheck },
    { id: "/agent/viewings", label: "Viewings", icon: Eye },
    { id: "/agent/messages", label: "Messages", icon: MessageSquare },
    { id: "/agent/earnings", label: "Earnings", icon: Wallet },
    { id: "/agent/reviews", label: "Reviews", icon: Star },
  ];

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-card border-b border-border text-foreground sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Home className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg">Agent Portal</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => signOut({ callbackUrl: "/signin" })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive border border-border transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Log Out
          </button>
          <ThemeToggle />
          <Button variant="ghost" className="p-2 hover:bg-secondary" onClick={() => setIsOpen(true)}>
            <Menu className="w-6 h-6 text-foreground" />
          </Button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 md:w-64 bg-card border-r border-border text-foreground flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 min-h-screen ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-border flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-foreground text-lg leading-tight">CampStay</h1>
              <p className="text-xs text-muted-foreground">Agent Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:block">
              <ThemeToggle />
            </div>
            <Button variant="ghost" className="md:hidden p-1.5 hover:bg-secondary" onClick={() => setIsOpen(false)}>
              <X className="w-5 h-5 text-foreground" />
            </Button>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Main Menu
          </p>

          {navItems.map(({ id, label, icon: Icon }) => {
            // For root '/agent', match exactly. Otherwise, match prefix.
            const isActive = id === '/agent' ? pathname === id : pathname.startsWith(id);
            return (
              <Link 
                href={id} 
                key={id} 
                onClick={() => setIsOpen(false)}
                className={`w-full flex items-center justify-start gap-3 px-3 py-4 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" /> <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border shrink-0">
          <Link href="/agent/settings" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-4 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
             <Settings className="w-5 h-5 shrink-0" /> Settings
          </Link>
          <div className="mt-2 p-4 rounded-xl bg-secondary shrink-0 cursor-pointer hover:bg-secondary/80 transition border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700 shrink-0 overflow-hidden">
                {user?.image ? (
                  <img src={user.image} alt={user.name || "Agent"} className="w-full h-full object-cover" />
                ) : (
                  initial
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{user?.name || "Agent"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email || "agent@example.com"}</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/signin" })}
            className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-destructive bg-destructive/10 hover:bg-destructive/20 border border-transparent transition-all"
          >
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      </aside>
    </>
  );
}
