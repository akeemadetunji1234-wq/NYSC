"use client";

import {
  LayoutDashboard,
  BarChart2,
  ShieldCheck,
  Users,
  CreditCard,
  AlertTriangle,
  ClipboardList,
  Handshake,
  Settings,
  UserCircle,
  Menu,
  X,
  Home,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { ThemeToggle } from "../../components/ThemeToggle";

const navGroups = [
  {
    group: "Dashboard",
    items: [
      { href: "/admin", label: "Overview & Analytics", icon: LayoutDashboard },
    ]
  },
  {
    group: "Directory & People",
    items: [
      { href: "/admin/users", label: "Corp Members", icon: Users },
      { href: "/admin/agents", label: "Agents & Hosts", icon: ShieldCheck },
      { href: "/admin/artisans", label: "Artisan Directory", icon: ClipboardList },
    ]
  },
  {
    group: "Operations",
    items: [
      { href: "/admin/backlog", label: "Property Backlog", icon: ClipboardList },
      { href: "/admin/disputes", label: "Disputes & Reports", icon: AlertTriangle },
      { href: "/admin/partnerships", label: "Partnerships", icon: Handshake },
    ]
  },
  {
    group: "Configuration",
    items: [
      { href: "/admin/settings", label: "System Settings", icon: Settings },
      { href: "/admin/profile", label: "My Profile", icon: UserCircle },
    ]
  }
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  const user = session?.user as any;
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "SA";

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 text-white sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#008A4B] rounded-lg flex items-center justify-center">
            <Home className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">Neat & Affordable</p>
            <p className="text-xs text-slate-400 leading-tight">Admin Portal</p>
          </div>
        </div>
        <button onClick={() => setOpen(true)} className="p-2 hover:bg-slate-800 rounded-lg">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 min-h-screen ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#008A4B] rounded-xl flex items-center justify-center shrink-0">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-base leading-tight">Neat & Affordable</p>
              <p className="text-xs text-slate-400 leading-tight">Admin Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={() => setOpen(false)} className="md:hidden p-1 hover:bg-slate-800 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
          {navGroups.map((section, idx) => (
            <div key={idx}>
              <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {section.group}
              </p>
              <div className="space-y-1">
                {section.items.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive(href)
                        ? "bg-[#008A4B] text-white shadow-md shadow-[#008A4B]/20"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-800 transition cursor-pointer">
            <div className="w-9 h-9 rounded-full bg-slate-600 flex items-center justify-center text-sm font-bold text-white shrink-0 overflow-hidden">
              {user?.image ? (
                <img src={user.image} alt={user.name || "Admin"} className="w-full h-full object-cover" />
              ) : (
                initial
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name || "Super Admin"}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email || "admin@neat-affordable.ng"}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
