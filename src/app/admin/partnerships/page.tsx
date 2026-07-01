"use client";
import { PageTransition } from "../../../components/layout/PageTransition";
import { Handshake, Building2, ExternalLink, Plus, Eye, MoreVertical, Info } from "lucide-react";
import { Button } from "../../../components/ui/button";

const partners = [
  { id: 1, name: "Guaranty Trust Bank", type: "Financial", status: "Active", revenue: "₦1.2M", joined: "Jan 12, 2026" },
  { id: 2, name: "NYSC Lagos Secretariat", type: "Government", status: "Active", revenue: "—", joined: "Dec 05, 2025", isGovt: true },
  { id: 3, name: "GIG Logistics", type: "Transport", status: "Pending", revenue: "—", joined: "Feb 18, 2026" },
  { id: 4, name: "Ikeja Electric", type: "Utility", status: "Active", revenue: "₦450k", joined: "Nov 22, 2025" },
];

export default function PartnershipsPage() {
  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Partnerships</h1>
            <p className="text-muted-foreground mt-1">Manage B2B contracts, revenue sharing, and affiliates.</p>
          </div>
          <Button className="bg-[#008A4B] hover:bg-[#006F3C] text-white flex items-center gap-2 rounded-xl">
            <Plus className="w-4 h-4" /> Add Partner
          </Button>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-card p-6 rounded-2xl shadow-sm border border-border flex items-center gap-4">
            <div className="p-4 bg-blue-50 rounded-xl">
              <Handshake className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Partners</p>
              <p className="text-2xl font-bold text-foreground">15</p>
            </div>
          </div>
          <div className="bg-card p-6 rounded-2xl shadow-sm border border-border flex items-center gap-4">
            <div className="p-4 bg-amber-50 rounded-xl">
              <Building2 className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
              <p className="text-2xl font-bold text-foreground">3</p>
            </div>
          </div>
          <div className="bg-card p-6 rounded-2xl shadow-sm border border-border flex items-center gap-4">
            <div className="p-4 bg-emerald-50 rounded-xl">
              <ExternalLink className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Partner Revenue</p>
              <p className="text-2xl font-bold text-foreground">₦1.65M</p>
            </div>
          </div>
        </div>

        {/* Partners Table */}
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary border-b border-border text-sm font-medium text-muted-foreground">
                  <th className="p-4">Partner Name</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Revenue Share</th>
                  <th className="p-4">Joined Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {partners.map((partner) => (
                  <tr key={partner.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-bold text-foreground">{partner.name}</td>
                    <td className="p-4 text-muted-foreground">
                       <span className="inline-flex items-center px-2 py-1 bg-secondary text-muted-foreground rounded text-xs font-medium">
                         {partner.type}
                       </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        partner.status === "Active" 
                          ? "bg-emerald-100 text-emerald-700" 
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {partner.status}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-foreground">
                      <div className="flex items-center gap-2 group/tooltip relative">
                        {partner.revenue}
                        {partner.isGovt && (
                          <>
                             <Info className="w-4 h-4 text-slate-400 cursor-help" />
                             {/* Custom Tooltip */}
                             <div className="absolute left-10 hidden group-hover/tooltip:block bg-slate-800 text-white text-xs p-2 rounded w-48 shadow-lg z-10 pointer-events-none">
                                Government partners are strategic alliances with no direct revenue share.
                             </div>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">{partner.joined}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2 items-center">
                        <Button variant="outline" size="sm" className="text-muted-foreground hover:text-slate-900 rounded-lg">
                          <Eye className="w-4 h-4 mr-1.5" /> View
                        </Button>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-900 px-2">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
