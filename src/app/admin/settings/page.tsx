"use client";
import { PageTransition } from "../../../components/layout/PageTransition";
import { Save, Bell, Shield, Server, Globe } from "lucide-react";
import { Button } from "../../../components/ui/button";

export default function SettingsPage() {
  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
            <p className="text-slate-500 mt-1">Manage global configurations and platform rules.</p>
          </div>
          <Button className="bg-[#008A4B] hover:bg-[#006F3C] text-white flex items-center gap-2 rounded-xl">
            <Save className="w-4 h-4" /> Save Changes
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Settings Navigation */}
          <div className="md:col-span-1 space-y-1">
            <button className="w-full flex items-center gap-3 px-4 py-3 bg-white text-[#008A4B] font-medium rounded-xl shadow-sm border border-slate-200">
              <Globe className="w-5 h-5" /> General
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 font-medium rounded-xl hover:bg-slate-100 transition">
              <Shield className="w-5 h-5 text-slate-400" /> Security
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 font-medium rounded-xl hover:bg-slate-100 transition">
              <Bell className="w-5 h-5 text-slate-400" /> Notifications
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 font-medium rounded-xl hover:bg-slate-100 transition">
              <Server className="w-5 h-5 text-slate-400" /> API & Webhooks
            </button>
          </div>

          {/* Settings Content */}
          <div className="md:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900">General Configuration</h2>
                <p className="text-sm text-slate-500 mt-1">Basic settings that apply across the entire platform.</p>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Platform Name</label>
                    <input type="text" defaultValue="CampStay" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#008A4B]/20 focus:border-[#008A4B] transition" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Support Email</label>
                    <input type="email" defaultValue="support@campstay.ng" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#008A4B]/20 focus:border-[#008A4B] transition" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Default Commission Rate (%)</label>
                  <input type="number" defaultValue="5" className="w-full sm:w-1/2 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#008A4B]/20 focus:border-[#008A4B] transition" />
                  <p className="text-xs text-slate-500">This is the default percentage taken from successful bookings.</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900">Platform Toggles</h2>
                <p className="text-sm text-slate-500 mt-1">Enable or disable specific system features.</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900">Maintenance Mode</h4>
                    <p className="text-sm text-slate-500">Displays a maintenance screen to all non-admin users.</p>
                  </div>
                  <div className="w-12 h-6 bg-slate-200 rounded-full relative cursor-pointer">
                    <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 shadow-sm"></div>
                  </div>
                </div>
                <div className="w-full h-px bg-slate-100"></div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900">Auto-Approve Verified Agents</h4>
                    <p className="text-sm text-slate-500">Automatically bypass manual review if NIN/BVN checks pass.</p>
                  </div>
                  <div className="w-12 h-6 bg-[#008A4B] rounded-full relative cursor-pointer">
                    <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 shadow-sm"></div>
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
