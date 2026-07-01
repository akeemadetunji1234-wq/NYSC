"use client";

import { PageTransition } from "../../../components/layout/PageTransition";
import { User, Building, Banknote, Bell, Shield, MapPin, Save } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export default function AgentSettingsPage() {
  const [activeTab, setActiveTab] = useState("business");

  const handleSave = () => {
    toast.success("Settings saved successfully!");
  };

  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Agent Settings</h1>
            <p className="text-muted-foreground mt-1">Manage your business profile, payout details, and preferences.</p>
          </div>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 rounded-xl">
            <Save className="w-4 h-4" /> Save Changes
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Settings Navigation */}
          <div className="md:col-span-1 flex overflow-x-auto md:flex-col gap-2 md:gap-0 md:space-y-1 pb-2 md:pb-0 scrollbar-hide">
            <button 
              onClick={() => setActiveTab('business')}
              className={`whitespace-nowrap flex-shrink-0 md:w-full flex items-center gap-3 px-4 py-3 font-medium rounded-xl transition ${activeTab === 'business' ? 'bg-card text-blue-600 shadow-sm border border-border' : 'text-muted-foreground hover:bg-secondary'}`}
            >
              <Building className={`w-5 h-5 shrink-0 ${activeTab === 'business' ? '' : 'text-slate-400'}`} /> Business Profile
            </button>
            <button 
              onClick={() => setActiveTab('payouts')}
              className={`whitespace-nowrap flex-shrink-0 md:w-full flex items-center gap-3 px-4 py-3 font-medium rounded-xl transition ${activeTab === 'payouts' ? 'bg-card text-blue-600 shadow-sm border border-border' : 'text-muted-foreground hover:bg-secondary'}`}
            >
              <Banknote className={`w-5 h-5 shrink-0 ${activeTab === 'payouts' ? '' : 'text-slate-400'}`} /> Payout Details
            </button>
            <button 
              onClick={() => setActiveTab('notifications')}
              className={`whitespace-nowrap flex-shrink-0 md:w-full flex items-center gap-3 px-4 py-3 font-medium rounded-xl transition ${activeTab === 'notifications' ? 'bg-card text-blue-600 shadow-sm border border-border' : 'text-muted-foreground hover:bg-secondary'}`}
            >
              <Bell className={`w-5 h-5 shrink-0 ${activeTab === 'notifications' ? '' : 'text-slate-400'}`} /> Notifications
            </button>
            <button 
              onClick={() => setActiveTab('security')}
              className={`whitespace-nowrap flex-shrink-0 md:w-full flex items-center gap-3 px-4 py-3 font-medium rounded-xl transition ${activeTab === 'security' ? 'bg-card text-blue-600 shadow-sm border border-border' : 'text-muted-foreground hover:bg-secondary'}`}
            >
              <Shield className={`w-5 h-5 shrink-0 ${activeTab === 'security' ? '' : 'text-slate-400'}`} /> Security
            </button>
          </div>

          {/* Settings Content */}
          <div className="md:col-span-3 space-y-6">
            {activeTab === 'business' && (
              <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden animate-in fade-in duration-300">
                <div className="p-6 border-b border-border">
                  <h2 className="text-lg font-bold text-foreground">Business Profile</h2>
                  <p className="text-sm text-muted-foreground mt-1">Information displayed to members on your property listings.</p>
                </div>
                <div className="p-6 space-y-6">
                  <div className="flex items-center gap-6">
                     <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center border-2 border-dashed border-slate-300 text-slate-400">
                        <User className="w-8 h-8" />
                     </div>
                     <Button variant="outline" className="rounded-xl">Upload Logo</Button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Business/Agency Name</label>
                      <input type="text" defaultValue="John Doe Properties" className="w-full px-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Contact Email</label>
                      <input type="email" defaultValue="john@example.com" className="w-full px-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                      <input type="tel" defaultValue="+234 800 000 0000" className="w-full px-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-1"><MapPin className="w-4 h-4" /> Office Address</label>
                      <input type="text" defaultValue="Plot 123, Abuja" className="w-full px-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'payouts' && (
              <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden animate-in fade-in duration-300">
                <div className="p-6 border-b border-border">
                  <h2 className="text-lg font-bold text-foreground">Payout Details</h2>
                  <p className="text-sm text-muted-foreground mt-1">Where your earnings from bookings will be sent.</p>
                </div>
                <div className="p-6 space-y-6">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                     <p className="text-sm text-amber-800 font-medium">Please ensure the bank account name matches your verified business/personal name.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Bank Name</label>
                      <select className="w-full px-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition bg-card">
                        <option>Guaranty Trust Bank</option>
                        <option>Access Bank</option>
                        <option>Zenith Bank</option>
                        <option>First Bank</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Account Number</label>
                      <input type="text" defaultValue="0123456789" className="w-full px-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Account Name</label>
                      <input type="text" defaultValue="John Doe Properties" className="w-full px-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition" disabled />
                      <p className="text-xs text-muted-foreground">Auto-resolved from account number</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(activeTab === 'notifications' || activeTab === 'security') && (
              <div className="bg-card rounded-2xl shadow-sm border border-border py-20 px-4 text-center animate-in fade-in duration-300">
                 <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                    {activeTab === 'notifications' ? <Bell className="w-8 h-8 text-slate-300" /> : <Shield className="w-8 h-8 text-slate-300" />}
                 </div>
                 <h3 className="text-lg font-bold text-foreground mb-2">Coming Soon</h3>
                 <p className="text-sm text-muted-foreground max-w-sm mx-auto">This section is currently under development. Check back later for updates.</p>
              </div>
            )}

          </div>
        </div>
      </div>
    </PageTransition>
  );
}
