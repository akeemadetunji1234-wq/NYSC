"use client";

import {
  LayoutDashboard,
  Activity,
  BarChart2,
  ShieldCheck,
  Users,
  CreditCard,
  AlertTriangle,
  ClipboardList,
  Handshake,
  Bell,
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
      { href: "/control-room-7f3k9d", label: "Overview & Analytics", icon: LayoutDashboard },
    ]
  },
  {
    group: "Directory & People",
    items: [
      { href: "/control-room-7f3k9d/users", label: "Corp Members", icon: Users },
      { href: "/control-room-7f3k9d/agents", label: "Agents & Hosts", icon: ShieldCheck },
      { href: "/control-room-7f3k9d/artisans", label: "Artisan Directory", icon: ClipboardList },
    ]
  },
  {
    group: "Operations",
    items: [
      { href: "/control-room-7f3k9d/backlog", label: "Property Backlog", icon: ClipboardList },
      { href: "/control-room-7f3k9d/disputes", label: "Disputes & Reports", icon: AlertTriangle },
      { href: "/control-room-7f3k9d/reports", label: "Listing Safety", icon: ShieldCheck },
      { href: "/control-room-7f3k9d/payments", label: "Premium Payments", icon: CreditCard },
      { href: "/control-room-7f3k9d/monitoring", label: "Production Monitoring", icon: Activity },
      { href: "/control-room-7f3k9d/notifications", label: "Notification Center", icon: Bell },
    ]
  },
  {
    group: "Configuration",
    items: [
      { href: "/control-room-7f3k9d/audit", label: "Audit Logs", icon: ShieldCheck },
      { href: "/control-room-7f3k9d/cms", label: "CMS & Content", icon: ClipboardList },
      { href: "/control-room-7f3k9d/settings", label: "System Settings", icon: Settings },
      { href: "/control-room-7f3k9d/profile", label: "My Profile", icon: UserCircle },
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
    href === "/control-room-7f3k9d" ? pathname === "/control-room-7f3k9d" : pathname.startsWith(href);

  return (
    <>
      {/* Mobile top bar */}
      <div className="na-surface md:hidden flex items-center justify-between p-4 border-b border-border sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 na-brand-surface rounded-lg flex items-center justify-center">
            <Home className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">Neat & Affordable</p>
            <p className="text-xs text-muted-foreground leading-tight">Operations Portal</p>
          </div>
        </div>
        <button onClick={() => setOpen(true)} className="na-interactive na-focus-ring p-2 hover:bg-secondary rounded-lg">
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
        className={`na-surface fixed inset-y-0 left-0 z-50 w-64 border-r flex flex-col transform transition-transform duration-300 ease-out md:relative md:translate-x-0 min-h-screen ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 na-brand-surface rounded-xl flex items-center justify-center shrink-0">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-foreground text-base leading-tight">Neat & Affordable</p>
              <p className="text-xs text-muted-foreground leading-tight">Operations Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={() => setOpen(false)} className="na-interactive na-focus-ring md:hidden p-1 hover:bg-secondary rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
          {navGroups.map((section, idx) => (
            <div key={idx}>
              <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest na-muted-text">
                {section.group}
              </p>
              <div className="space-y-1">
                {section.items.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`na-nav-item na-focus-ring flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                      isActive(href)
                        ? "bg-[var(--na-brand)] text-white shadow-md shadow-[var(--na-brand)]/20"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
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
        <div className="p-4 border-t border-border">
          <div className="na-card flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-secondary cursor-pointer">
            <div className="w-9 h-9 rounded-full na-brand-soft flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden">
              {user?.image ? (
                <img src={user.image} alt={user.name || "Admin"} className="w-full h-full object-cover" />
              ) : (
                initial
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{user?.name || "Super Admin"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email || "admin@neat-affordable.ng"}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
