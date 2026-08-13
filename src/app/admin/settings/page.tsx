"use client";

import { PageTransition } from "../../../components/layout/PageTransition";
import { Settings, Shield, Globe, Bell, CreditCard, Save, RefreshCw } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("System settings updated successfully.");
    }, 1500);
  };

  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 pb-20">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">System Settings</h1>
            <p className="text-muted-foreground mt-1">Configure platform-wide variables and features.</p>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="bg-[#008A4B] hover:bg-[#006F3C] text-white rounded-xl shadow-sm">
            {isSaving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Navigation/Groups */}
          <div className="space-y-2">
            <button className="w-full flex items-center gap-3 p-3 text-sm font-semibold bg-[#008A4B]/10 text-[#008A4B] rounded-xl border border-[#008A4B]/20">
              <Globe className="w-5 h-5" /> General Configuration
            </button>
            <button className="w-full flex items-center gap-3 p-3 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground rounded-xl transition">
              <CreditCard className="w-5 h-5" /> Payments & Fees
            </button>
            <button className="w-full flex items-center gap-3 p-3 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground rounded-xl transition">
              <Shield className="w-5 h-5" /> Security & Access
            </button>
            <button className="w-full flex items-center gap-3 p-3 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground rounded-xl transition">
              <Bell className="w-5 h-5" /> Notifications
            </button>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border bg-secondary/50">
                <h2 className="font-bold text-lg text-foreground">Platform Fees</h2>
                <p className="text-sm text-muted-foreground">Configure the percentage fees applied to bookings.</p>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="text-sm font-semibold text-foreground">Agent Booking Fee (%)</label>
                  <p className="text-xs text-muted-foreground mb-2">The percentage deducted from the agent's payout.</p>
                  <input type="number" defaultValue={5} className="w-full max-w-[200px] border border-border rounded-xl px-4 py-2.5 text-sm bg-secondary focus:ring-2 focus:ring-[#008A4B]/30 outline-none" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground">Corp Member Service Fee (%)</label>
                  <p className="text-xs text-muted-foreground mb-2">The percentage added to the total rent for corp members.</p>
                  <input type="number" defaultValue={2} className="w-full max-w-[200px] border border-border rounded-xl px-4 py-2.5 text-sm bg-secondary focus:ring-2 focus:ring-[#008A4B]/30 outline-none" />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border bg-secondary/50">
                <h2 className="font-bold text-lg text-foreground">Agent Verification</h2>
                <p className="text-sm text-muted-foreground">Rules for agent onboarding and listing approvals.</p>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-semibold text-foreground">Auto-Approve Verified Agents</label>
                    <p className="text-xs text-muted-foreground">Automatically publish listings from agents who have KYC verified.</p>
                  </div>
                  <div className="relative inline-block w-12 h-6 rounded-full bg-[#008A4B] cursor-pointer">
                    <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full translate-x-6 transition-transform"></span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-semibold text-foreground">Require BVN for Payouts</label>
                    <p className="text-xs text-muted-foreground">Mandate agents to link their BVN before withdrawing funds.</p>
                  </div>
                  <div className="relative inline-block w-12 h-6 rounded-full bg-[#008A4B] cursor-pointer">
                    <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full translate-x-6 transition-transform"></span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border bg-red-50 dark:bg-red-950/20">
                <h2 className="font-bold text-lg text-red-600 dark:text-red-400">Danger Zone</h2>
                <p className="text-sm text-red-500/80">Critical system actions.</p>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-semibold text-foreground">Maintenance Mode</label>
                    <p className="text-xs text-muted-foreground">Disable the platform for users. Only admins can log in.</p>
                  </div>
                  <div className="relative inline-block w-12 h-6 rounded-full bg-slate-300 dark:bg-slate-700 cursor-pointer">
                    <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform"></span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </PageTransition>
  );
}
