"use client";

import { useEffect, useState } from "react";
import { PageTransition } from "../../../components/layout/PageTransition";
import { BadgeCheck, Shield, CheckCircle, Clock3, XCircle, RefreshCw, Send } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { getAgentProfile, submitAgentVerification } from "../../actions/agent";
import { toast } from "sonner";

interface AgentProfile {
  id: string;
  name: string | null;
  agentVerified: boolean;
  agentVerifiedAt: Date | string | null;
  agentRejected: boolean;
  rejectionReason: string | null;
  verificationStatus: string;
  verificationNotes: string | null;
}

export default function VerifiedBadgePage() {
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadProfile = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await getAgentProfile();
      setProfile(data as AgentProfile | null);
    } catch (error: any) {
      if (!silent) toast.error(error.message || "Unable to load verification status");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    const interval = setInterval(() => loadProfile(true), 15000);
    return () => clearInterval(interval);
  }, []);

  const submit = async () => {
    setIsSubmitting(true);
    try {
      await submitAgentVerification();
      toast.success("Verification request submitted for admin review.");
      await loadProfile(true);
    } catch (error: any) {
      toast.error(error.message || "Unable to submit verification request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const status = profile?.verificationStatus || "UNVERIFIED";
  const verified = status === "VERIFIED" || profile?.agentVerified;
  const rejected = status === "REJECTED" || profile?.agentRejected;
  const pending = status === "PENDING";

  const statusLabel = verified ? "Verified" : rejected ? "Changes requested" : pending ? "Under review" : "Not submitted";
  const StatusIcon = verified ? CheckCircle : rejected ? XCircle : pending ? Clock3 : Shield;

  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border shadow-inner ${verified ? "bg-emerald-50 border-emerald-200" : rejected ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
            <BadgeCheck className={`w-10 h-10 ${verified ? "text-emerald-500" : rejected ? "text-red-500" : "text-amber-500"}`} />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Agent Verification</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">Track your verification request and see exactly when your account is ready to display the Verified Agent badge.</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Current status</p>
              <div className="flex items-center gap-2 mt-2">
                <StatusIcon className={`w-5 h-5 ${verified ? "text-emerald-600" : rejected ? "text-red-600" : "text-amber-600"}`} />
                <h2 className="text-xl font-bold text-foreground">{statusLabel}</h2>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => loadProfile()} disabled={isLoading} className="gap-2">
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>

          <div className="space-y-6 pt-6">
            {[
              { label: "Agent account", detail: profile?.name ? `Profile for ${profile.name}` : "Complete your agent profile", complete: Boolean(profile?.name) },
              { label: "Verification request", detail: verified ? "Request approved by an administrator" : pending ? "Request is in the admin review queue" : rejected ? "Please review the administrator's feedback" : "Submit your account for review", complete: verified || pending },
              { label: "Verified Agent badge", detail: verified ? `Active${profile?.agentVerifiedAt ? ` since ${new Date(profile.agentVerifiedAt).toLocaleDateString()}` : ""}` : "Available after approval", complete: Boolean(verified) },
            ].map((step) => (
              <div key={step.label} className="flex items-start gap-4">
                <div className="mt-1">{step.complete ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-300" />}</div>
                <div>
                  <h4 className="font-semibold text-foreground">{step.label}</h4>
                  <p className="text-sm text-muted-foreground">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>

          {profile?.verificationNotes && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/20 dark:text-red-200">
              <p className="font-bold mb-1">Administrator feedback</p>
              <p>{profile.verificationNotes}</p>
            </div>
          )}

          {!verified && (
            <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl bg-secondary p-4">
              <p className="text-sm text-muted-foreground">Ensure your profile and contact information are accurate before submitting the review request.</p>
              <Button onClick={submit} disabled={isSubmitting || pending} className="bg-[#008A4B] hover:bg-[#00703C] text-white gap-2 shrink-0">
                <Send className="w-4 h-4" /> {pending ? "Under review" : "Submit for review"}
              </Button>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700 p-6 shadow-xl text-white">
          <div className="flex items-center gap-3 mb-6"><Shield className="w-6 h-6 text-amber-400" /><h2 className="text-xl font-bold">Verification benefits</h2></div>
          <ul className="space-y-4 text-sm font-medium text-slate-200">
            <li className="flex items-center gap-3"><BadgeCheck className="w-4 h-4 text-amber-400" /> Verified badge on published listings</li>
            <li className="flex items-center gap-3"><BadgeCheck className="w-4 h-4 text-amber-400" /> Stronger trust signal for corps members</li>
            <li className="flex items-center gap-3"><BadgeCheck className="w-4 h-4 text-amber-400" /> Eligibility for premium listing tools</li>
          </ul>
        </div>
      </div>
    </PageTransition>
  );
}
