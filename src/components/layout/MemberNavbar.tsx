"use client";

import { Search, History, MessageSquare, User, Menu, X, Tent, LogOut, Crown, Bell, Wifi, MapPin, Wrench } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "../ui/button";
import { ThemeToggle } from "../ThemeToggle";

export function MemberNavbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  const user = session?.user as any;
  const initial = user?.name ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) : "ME";

  const navItems = [
    { id: "/member",          label: "Explore",   icon: Search },
    { id: "/member/history",  label: "My Stays",  icon: History },
    { id: "/member/messages", label: "Messages",  icon: MessageSquare },
    { id: "/member/profile",  label: "Profile",   icon: User },
  ];

  return (
    <header className="bg-card dark:bg-slate-950 border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        <Link href="/member" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#008A4B] rounded-lg flex items-center justify-center">
            <Tent className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-foreground hidden sm:block">Neat & Affordable</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map(({ id, label, icon: Icon }) => {
            const isActive = id === "/member" ? pathname === id : pathname.startsWith(id);
            return (
              <Link
                key={id}
                href={id}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  isActive ? "text-[#008A4B]" : "text-muted-foreground hover:text-slate-900"
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          <ThemeToggle />

          {/* Notifications bell — premium only */}
          <Link
            href="/member/notifications"
            className={`relative p-1.5 rounded-lg transition-colors ${
              user?.isPremium
                ? "text-[#008A4B] hover:bg-emerald-50"
                : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            <Bell className="w-5 h-5" />
            {user?.isPremium && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#008A4B] border border-white" />
            )}
          </Link>

          {/* User chip */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border">
            <div className="w-6 h-6 rounded-full bg-[#008A4B] flex items-center justify-center text-xs font-bold text-white overflow-hidden">
              {user?.image ? (
                <img src={user.image} alt={user.name || "Me"} className="w-full h-full object-cover" />
              ) : initial}
            </div>
            <span className="text-sm font-medium text-foreground max-w-[80px] truncate">
              {user?.name?.split(" ")[0] || "Me"}
            </span>
          </div>

          {/* Go Premium button — always visible, adapts to screen size */}
          {!user?.isPremium ? (
            <Link
              href="/member/premium"
              className="inline-flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-400 to-amber-500 text-amber-900 hover:from-amber-500 hover:to-amber-600 transition-all shadow-sm"
            >
              <Crown className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Go Premium</span>
            </Link>
          ) : (
            <div className="inline-flex items-center gap-1 px-2 md:px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold">
              <Crown className="w-3 h-3 shrink-0" />
              <span className="hidden sm:inline">Premium</span>
            </div>
          )}

          {/* Desktop logout */}
          <button
            onClick={() => {
              localStorage.setItem("theme", "light");
              document.documentElement.classList.remove("dark");
              document.documentElement.classList.add("light");
              signOut({ callbackUrl: "/signin" });
            }}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive border border-border transition-all"
          >
            <LogOut className="w-3.5 h-3.5" /> Log Out
          </button>

          {/* Mobile menu toggle */}
          <Button variant="ghost" className="md:hidden p-2" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="w-6 h-6 text-foreground" /> : <Menu className="w-6 h-6 text-foreground" />}
          </Button>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden border-t border-border bg-card">
          <nav className="flex flex-col p-4 space-y-2">
            {navItems.map(({ id, label, icon: Icon }) => {
              const isActive = id === "/member" ? pathname === id : pathname.startsWith(id);
              return (
                <Link
                  key={id}
                  href={id}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive ? "bg-[#008A4B]/10 text-[#008A4B]" : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <Icon className="w-5 h-5" /> {label}
                </Link>
              );
            })}
            {/* Premium features section in mobile menu */}
            {user?.isPremium && (
              <div className="pt-2 border-t border-border mt-1">
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider px-1 mb-2 flex items-center gap-1">
                  <Crown className="w-3 h-3" /> Premium Features
                </p>
                {[
                  { href: "/member/notifications", label: "New Listing Alerts", icon: Bell },
                  { href: "/member/offline", label: "Offline Mode", icon: Wifi },
                  { href: "/member/transport", label: "Transport Guides", icon: MapPin },
                  { href: "/member/artisans", label: "Artisan Directory", icon: Wrench },
                ].map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-xl text-sm font-medium text-amber-700 hover:bg-amber-50 transition-colors"
                  >
                    <Icon className="w-4 h-4 text-amber-600" /> {label}
                  </Link>
                ))}
              </div>
            )}
            <button
              onClick={() => {
                localStorage.setItem("theme", "light");
                document.documentElement.classList.remove("dark");
                document.documentElement.classList.add("light");
                signOut({ callbackUrl: "/signin" });
              }}
              className="flex items-center gap-3 p-3 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition mt-2"
            >
              <LogOut className="w-5 h-5" /> Log Out
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
