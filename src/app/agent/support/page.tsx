"use client";

import { useSession } from "next-auth/react";
import { PageTransition } from "../../../components/layout/PageTransition";
import { ShieldCheck, MessageSquare, PhoneCall, Mail } from "lucide-react";
import { Button } from "../../../components/ui/button";

export default function PrioritySupportPage() {
  const { data: session } = useSession();
  const userName = (session?.user as any)?.name || "Agent";
  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-emerald-800 to-emerald-600 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-emerald-200 font-bold text-xs uppercase tracking-wider mb-3">
              <ShieldCheck className="w-4 h-4" /> Premium Support
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">We're here for you 24/7, {userName}</h1>
            <p className="text-emerald-100 max-w-md text-sm leading-relaxed">As a Premium Agent, you get front-of-the-line access to our dedicated support team to resolve issues instantly.</p>
          </div>
          <div className="relative z-10">
            <Button className="bg-white text-emerald-700 hover:bg-emerald-50 rounded-xl px-8 py-6 font-bold shadow-xl border border-emerald-100">
              <MessageSquare className="w-5 h-5 mr-2" /> Start Live Chat
            </Button>
          </div>
          <ShieldCheck className="absolute -right-10 -bottom-10 w-64 h-64 text-emerald-500 opacity-20 rotate-12" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Fast-track Ticket */}
          <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 shadow-sm">
            <h2 className="text-xl font-bold text-foreground mb-2">Submit Priority Ticket</h2>
            <p className="text-sm text-muted-foreground mb-6">Your tickets are automatically flagged as High Priority.</p>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-1">Subject</label>
                <input required type="text" className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20" placeholder="E.g., Issue with latest booking" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-1">Details</label>
                <textarea required rows={4} className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 resize-none" placeholder="Describe your issue in detail..."></textarea>
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 shadow-md font-bold">
                Submit Ticket
              </Button>
            </form>
          </div>

          {/* Contact Methods */}
          <div className="space-y-4">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex items-center gap-5 hover:border-emerald-300 transition cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <PhoneCall className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-lg">Direct Phone Line</h3>
                <p className="text-sm text-muted-foreground mb-1">Skip the hold queue instantly.</p>
                <p className="text-sm font-bold text-blue-600">0800-PREMIUM-AGENT</p>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex items-center gap-5 hover:border-emerald-300 transition cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-lg">Dedicated Email</h3>
                <p className="text-sm text-muted-foreground mb-1">Guaranteed response within 1 hour.</p>
                <p className="text-sm font-bold text-purple-600">vip@neataffordable.ng</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
