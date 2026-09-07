import Link from "next/link";
import { Activity, FileSearch, ShieldCheck } from "lucide-react";

const safetyLinks = [
  {
    href: "/admin/reports",
    title: "Listing Safety",
    description: "Review listing reports, moderation status, and user-submitted safety concerns.",
    icon: ShieldCheck,
  },
  {
    href: "/admin/monitoring",
    title: "Production Monitoring",
    description: "Inspect application diagnostics, provider readiness, and recent operational signals.",
    icon: Activity,
  },
  {
    href: "/admin/audit",
    title: "Audit Logs",
    description: "Review accountability events for authentication, role, listing, booking, and payment workflows.",
    icon: FileSearch,
  },
];

export default function AdminSafetyPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-8 p-4 md:p-8">
      <header className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-slate-50 p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#008A4B] text-white shadow-sm">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Admin safety</p>
            <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl">Safety and operational controls</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
              Use these protected admin workspaces to review reports, monitor production health, and trace security-relevant changes.
            </p>
          </div>
        </div>
      </header>

      <section aria-labelledby="safety-workspaces" className="grid gap-4 md:grid-cols-3">
        <h2 id="safety-workspaces" className="sr-only">Safety workspaces</h2>
        {safetyLinks.map(({ href, title, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            <Icon className="h-6 w-6 text-[#008A4B]" aria-hidden="true" />
            <h3 className="mt-4 font-semibold text-foreground group-hover:text-[#008A4B]">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            <span className="mt-4 inline-block text-sm font-semibold text-[#008A4B]">Open workspace →</span>
          </Link>
        ))}
      </section>
    </main>
  );
}

export const dynamic = "force-dynamic";
