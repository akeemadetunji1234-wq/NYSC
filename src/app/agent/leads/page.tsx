"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { PageTransition } from "../../../components/layout/PageTransition";
import { getAgentLeads, getAgentPremiumStatus, updateAgentLead } from "../../actions/premium";
import { RefreshCw, MessageSquare, Clock, UserRound, Home } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { toast } from "sonner";
import { RealtimeNotificationListener } from "../../../components/notifications/RealtimeNotificationListener";

const statuses = ["NEW", "CONTACTED", "QUALIFIED", "VIEWING", "WON", "LOST", "CLOSED"] as const;
type Lead = { id: string; status: typeof statuses[number]; message: string | null; createdAt: string | Date; lastContactedAt: string | Date | null; property: { id: string; title: string; location: string }; corpMember: { id: string; name: string | null; email: string; phone: string | null } };

export default function AgentLeadsPage() {
  const { data: session } = useSession();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [hasPremium, setHasPremium] = useState<boolean | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setLeads(await getAgentLeads(filter || undefined) as Lead[]);
    } catch (error: any) {
      toast.error(error.message || "Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const status = await getAgentPremiumStatus();
        if (!active) return;
        setHasPremium(status.active);
        if (status.active) await load();
        else setLoading(false);
      } catch (error: any) {
        if (!active) return;
        setHasPremium(false);
        setLoading(false);
        toast.error(error.message || "Failed to check premium access");
      }
    })();
    return () => { active = false; };
  }, [filter]);

  const changeStatus = async (lead: Lead, status: typeof statuses[number]) => {
    try {
      const updated = await updateAgentLead(lead.id, status);
      setLeads((current) => current.map((item) => item.id === lead.id ? { ...item, ...updated } as Lead : item));
    } catch (error: any) {
      toast.error(error.message || "Failed to update lead");
    }
  };

  return <PageTransition><RealtimeNotificationListener userId={(session?.user as any)?.id} enabled={hasPremium === true} onNotification={() => load()} events={["notification:new", "lead:new"]} /><div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6"><div className="flex flex-col md:flex-row md:items-end justify-between gap-4"><div><h1 className="text-3xl font-bold text-foreground flex items-center gap-2">Lead CRM <MessageSquare className="w-6 h-6 text-[#008A4B]" /></h1><p className="text-muted-foreground mt-1">Track real corp-member enquiries from first contact to booking.</p></div>{hasPremium && <div className="flex items-center gap-2"><select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-lg border border-border bg-card px-3 py-2 text-sm"><option value="">All statuses</option>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select><Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2"><RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh</Button></div>}</div>
    {hasPremium === null && <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">Checking Agent Premium access...</div>}
    {hasPremium === false && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center dark:border-amber-900/40 dark:bg-amber-950/20"><h2 className="text-xl font-bold text-foreground">Agent Premium required</h2><p className="mt-2 text-muted-foreground">Lead CRM is available on the ₦10,000 per annum Agent Premium plan as a one-time payment. No lead data is shown until the entitlement is active.</p><a href="/agent/premium" className="mt-5 inline-flex rounded-lg bg-[#008A4B] px-4 py-2 font-semibold text-white">View Agent Premium</a></div>}
    {hasPremium && <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{loading ? <div className="col-span-full p-10 text-center text-muted-foreground">Loading live leads...</div> : leads.length === 0 ? <div className="col-span-full rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">No real enquiries match this filter yet.</div> : leads.map((lead) => <div key={lead.id} className="bg-card rounded-2xl border border-border p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h2 className="font-bold text-foreground">{lead.corpMember.name || "Corp member"}</h2><p className="text-xs text-muted-foreground">{lead.corpMember.email}{lead.corpMember.phone ? ` · ${lead.corpMember.phone}` : ""}</p></div><span className="rounded-full bg-secondary px-2 py-1 text-[10px] font-bold text-muted-foreground">{lead.status}</span></div><div className="mt-4 space-y-2 text-sm"><p className="flex items-center gap-2 text-foreground"><Home className="w-4 h-4 text-[#008A4B]" /> {lead.property.title}</p><p className="text-xs text-muted-foreground">{lead.property.location}</p>{lead.message && <p className="rounded-xl bg-secondary p-3 text-xs leading-relaxed">{lead.message}</p>}<p className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="w-3.5 h-3.5" /> Created {new Date(lead.createdAt).toLocaleString()}</p></div><div className="mt-4 flex items-center gap-2"><UserRound className="w-4 h-4 text-muted-foreground" /><select value={lead.status} onChange={(e) => changeStatus(lead, e.target.value as typeof statuses[number])} className="flex-1 rounded-lg border border-border bg-background px-2 py-2 text-xs">{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></div></div>)}</div>}
  </div></PageTransition>;
}
