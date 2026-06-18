"use client";

import {
  LayoutDashboard,
  ShieldCheck,
  Users,
  ClipboardList,
  Handshake,
  Settings,
  UserCircle,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "../ui/button";

export function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { id: "/admin/overview", label: "Overview", icon: LayoutDashboard },
    { id: "/admin/verification", label: "Agent Verification", icon: ShieldCheck },
    { id: "/admin/users", label: "User Management", icon: Users },
    { id: "/admin/backlog", label: "Listing Backlog", icon: ClipboardList },
    { id: "/admin/partnerships", label: "Partnerships", icon: Handshake },
    { id: "/admin/settings", label: "System Settings", icon: Settings },
    { id: "/admin/profile", label: "My Profile", icon: UserCircle },
  ];

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 text-white sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#008A4B] rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg">CampStay Admin</span>
        </div>
        <Button variant="ghost" className="p-2 hover:bg-slate-800" onClick={() => setIsOpen(true)}>
          <Menu className="w-6 h-6" />
        </Button>
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
        className={`fixed inset-y-0 left-0 z-50 w-72 md:w-64 bg-slate-900 text-slate-300 flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 min-h-screen ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#008A4B] rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-lg leading-tight">CampStay</h1>
              <p className="text-xs text-slate-400">Admin Portal</p>
            </div>
          </div>
          <Button variant="ghost" className="md:hidden p-1.5 hover:bg-slate-800" onClick={() => setIsOpen(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Main Menu
          </p>

          {navItems.map(({ id, label, icon: Icon }) => {
            const isActive = pathname === id || (pathname === '/admin' && id === '/admin/verification');
            return (
              <Link href={id} key={id} onClick={() => setIsOpen(false)}>
                <Button
                  variant="ghost"
                  className={`w-full flex items-center justify-start gap-3 px-3 py-6 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#008A4B] text-white hover:bg-[#006F3C]"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" /> <span className="truncate">{label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>

        <Link href="/admin/profile" onClick={() => setIsOpen(false)}>
          <div className="p-4 border-t border-slate-800 m-4 rounded-xl bg-slate-800/50 shrink-0 hover:bg-slate-800 transition cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#008A4B] flex items-center justify-center text-sm font-bold text-white shrink-0">
                SA
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">Super Admin</p>
                <p className="text-xs text-slate-400 truncate">admin@campstay.ng</p>
              </div>
            </div>
          </div>
        </Link>
      </aside>
    </>
  );
}
