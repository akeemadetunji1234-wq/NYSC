"use client";
import { PageTransition } from "../../../components/layout/PageTransition";
import { Save, Bell, Shield, Server, Globe } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleSaveInit = () => {
    setIsConfirmOpen(true);
  };

  const handleSaveConfirm = () => {
    setIsConfirmOpen(false);
    const toastId = toast.loading("Saving configuration...");
    setTimeout(() => {
      toast.success("Settings saved successfully!", { id: toastId });
    }, 1000);
  };

  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">System Settings</h1>
            <p className="text-muted-foreground mt-1">Manage global configurations and platform rules.</p>
          </div>
          <Button onClick={handleSaveInit} className="bg-[#008A4B] hover:bg-[#006F3C] text-white flex items-center gap-2 rounded-xl">
            <Save className="w-4 h-4" /> Save Changes
          </Button>
        </div>

        {/* Confirmation Dialog */}
        <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <DialogContent className="sm:max-w-md bg-card border border-border rounded-2xl shadow-xl z-50 p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground">Confirm Changes</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-2">
                Are you sure you want to save these system settings? Changes to commission rates or maintenance mode will take effect immediately.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="pt-4 flex gap-2">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setIsConfirmOpen(false)}
                className="w-full sm:w-auto text-muted-foreground hover:text-slate-700 rounded-xl"
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={handleSaveConfirm}
                className="w-full sm:w-auto bg-[#008A4B] hover:bg-[#006F3C] text-white rounded-xl"
              >
                Confirm & Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Settings Navigation */}
          <div className="md:col-span-1 flex overflow-x-auto md:flex-col gap-2 md:gap-0 md:space-y-1 pb-2 md:pb-0 scrollbar-hide">
            <button 
              onClick={() => setActiveTab('general')}
              className={`whitespace-nowrap flex-shrink-0 md:w-full flex items-center gap-3 px-4 py-3 font-medium rounded-xl transition ${activeTab === 'general' ? 'bg-card text-[#008A4B] shadow-sm border border-border' : 'text-muted-foreground hover:bg-secondary'}`}
            >
              <Globe className={`w-5 h-5 shrink-0 ${activeTab === 'general' ? '' : 'text-slate-400'}`} /> General
            </button>
            <button 
              onClick={() => setActiveTab('security')}
              className={`whitespace-nowrap flex-shrink-0 md:w-full flex items-center gap-3 px-4 py-3 font-medium rounded-xl transition ${activeTab === 'security' ? 'bg-card text-[#008A4B] shadow-sm border border-border' : 'text-muted-foreground hover:bg-secondary'}`}
            >
              <Shield className={`w-5 h-5 shrink-0 ${activeTab === 'security' ? '' : 'text-slate-400'}`} /> Security
            </button>
            <button 
              onClick={() => setActiveTab('notifications')}
              className={`whitespace-nowrap flex-shrink-0 md:w-full flex items-center gap-3 px-4 py-3 font-medium rounded-xl transition ${activeTab === 'notifications' ? 'bg-card text-[#008A4B] shadow-sm border border-border' : 'text-muted-foreground hover:bg-secondary'}`}
            >
              <Bell className={`w-5 h-5 shrink-0 ${activeTab === 'notifications' ? '' : 'text-slate-400'}`} /> Notifications
            </button>
            <button 
              onClick={() => setActiveTab('api')}
              className={`whitespace-nowrap flex-shrink-0 md:w-full flex items-center gap-3 px-4 py-3 font-medium rounded-xl transition ${activeTab === 'api' ? 'bg-card text-[#008A4B] shadow-sm border border-border' : 'text-muted-foreground hover:bg-secondary'}`}
            >
              <Server className={`w-5 h-5 shrink-0 ${activeTab === 'api' ? '' : 'text-slate-400'}`} /> API & Webhooks
            </button>
          </div>

          {/* Settings Content */}
          <div className="md:col-span-3 space-y-6">
            {activeTab === 'general' ? (
              <>
                <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden animate-in fade-in duration-300">
                  <div className="p-6 border-b border-border">
                    <h2 className="text-lg font-bold text-foreground">General Configuration</h2>
                    <p className="text-sm text-muted-foreground mt-1">Basic settings that apply across the entire platform.</p>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Platform Name</label>
                        <input type="text" defaultValue="CampStay" className="w-full px-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-[#008A4B]/20 focus:border-[#008A4B] transition" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Support Email</label>
                        <input type="email" defaultValue="support@campstay.ng" className="w-full px-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-[#008A4B]/20 focus:border-[#008A4B] transition" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Default Commission Rate (%)</label>
                      <input type="number" defaultValue="5" className="w-full sm:w-1/2 px-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-[#008A4B]/20 focus:border-[#008A4B] transition" />
                      <p className="text-xs text-muted-foreground">This is the default percentage taken from successful bookings.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden animate-in fade-in duration-300">
                  <div className="p-6 border-b border-border">
                    <h2 className="text-lg font-bold text-foreground">Platform Toggles</h2>
                    <p className="text-sm text-muted-foreground mt-1">Enable or disable specific system features.</p>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="font-medium text-foreground">Maintenance Mode</h4>
                        <p className="text-sm text-muted-foreground">Displays a maintenance screen to all non-admin users.</p>
                      </div>
                      <div className="w-12 h-6 bg-slate-200 rounded-full relative cursor-pointer shrink-0 self-start sm:self-auto">
                        <div className="w-4 h-4 bg-card rounded-full absolute top-1 left-1 shadow-sm"></div>
                      </div>
                    </div>
                    <div className="w-full h-px bg-secondary"></div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="font-medium text-foreground">Auto-Approve Verified Agents</h4>
                        <p className="text-sm text-muted-foreground">Automatically bypass manual review if NIN/BVN checks pass.</p>
                      </div>
                      <div className="w-12 h-6 bg-[#008A4B] rounded-full relative cursor-pointer shrink-0 self-start sm:self-auto">
                        <div className="w-4 h-4 bg-card rounded-full absolute top-1 right-1 shadow-sm"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-card rounded-2xl shadow-sm border border-border py-20 px-4 text-center animate-in fade-in duration-300">
                 <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                    {activeTab === 'security' && <Shield className="w-8 h-8 text-slate-300" />}
                    {activeTab === 'notifications' && <Bell className="w-8 h-8 text-slate-300" />}
                    {activeTab === 'api' && <Server className="w-8 h-8 text-slate-300" />}
                 </div>
                 <h3 className="text-lg font-bold text-foreground mb-2">Coming Soon</h3>
                 <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    The <strong>{activeTab === 'security' ? 'Security' : activeTab === 'notifications' ? 'Notifications' : 'API & Webhooks'}</strong> module is currently under active development.
                 </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
