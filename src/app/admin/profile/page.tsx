"use client";
import { PageTransition } from "../../../components/layout/PageTransition";
import { User, Mail, ShieldCheck, KeyRound, Smartphone, LogOut } from "lucide-react";
import { Button } from "../../../components/ui/button";

export default function ProfilePage() {
  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
          <p className="text-slate-500 mt-1">Manage your administrative account and security preferences.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Profile Sidebar */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center">
              <div className="w-24 h-24 bg-[#008A4B] rounded-full mx-auto flex items-center justify-center text-3xl font-bold text-white shadow-md mb-4 relative">
                SA
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 border-2 border-white rounded-full"></div>
              </div>
              <h2 className="text-lg font-bold text-slate-900">Super Admin</h2>
              <p className="text-sm text-slate-500 mb-6">admin@campstay.ng</p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" /> Full Access
              </div>
            </div>

            <Button variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl flex items-center gap-2">
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          </div>

          {/* Profile Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Personal Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Personal Information</h3>
                <Button variant="ghost" size="sm" className="text-[#008A4B] hover:text-[#006F3C] font-medium">Edit</Button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-slate-500 flex items-center gap-2 mb-1">
                      <User className="w-4 h-4" /> Full Name
                    </label>
                    <p className="font-medium text-slate-900">Super Admin</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500 flex items-center gap-2 mb-1">
                      <Mail className="w-4 h-4" /> Email Address
                    </label>
                    <p className="font-medium text-slate-900">admin@campstay.ng</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Security Settings</h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <KeyRound className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">Password</h4>
                      <p className="text-sm text-slate-500">Last changed 3 months ago</p>
                    </div>
                  </div>
                  <Button variant="outline" className="rounded-xl">Update</Button>
                </div>
                
                <div className="w-full h-px bg-slate-100"></div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <Smartphone className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">Two-Factor Authentication</h4>
                      <p className="text-sm text-slate-500">Add an extra layer of security to your account.</p>
                    </div>
                  </div>
                  <Button className="bg-[#008A4B] hover:bg-[#006F3C] text-white rounded-xl">Enable</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
