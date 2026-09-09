"use client";

import { PageTransition } from "../../../components/layout/PageTransition";
import { AlertTriangle, ShieldAlert, CheckCircle2, XCircle, ArrowUpRight, Filter } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { useState, useEffect } from "react";
import { getAdminListingReports, updateListingReportStatus } from "../../actions/report";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminListingReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);

  const loadReports = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await getAdminListingReports();
      setReports(data);
      if (data.length > 0 && !activeReportId && !silent) {
        setActiveReportId(data[0].id);
      }
    } catch (err) {
      if (!silent) toast.error("Failed to load listing reports");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
    const interval = setInterval(() => loadReports(true), 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (reportId: string, newStatus: "REVIEWING" | "RESOLVED" | "DISMISSED") => {
    try {
      await updateListingReportStatus(reportId, newStatus);
      toast.success(`Report status updated to ${newStatus}`);
      await loadReports(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const filteredReports = reports.filter(r => filterStatus === "ALL" || r.status === filterStatus);
  const selectedReport = reports.find(r => r.id === activeReportId) || filteredReports[0];

  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Listing Safety & Reports</h1>
            <p className="text-muted-foreground mt-1">Review user-submitted reports for misleading, unsafe, or unavailable property listings.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync
            </span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-card border border-border text-foreground text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-[#008A4B]"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="REVIEWING">Reviewing</option>
              <option value="RESOLVED">Resolved</option>
              <option value="DISMISSED">Dismissed</option>
            </select>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[600px]">
          {/* Reports List */}
          <div className="w-full md:w-1/3 border-r border-border flex flex-col">
            <div className="p-4 border-b border-border bg-secondary flex items-center justify-between">
              <h2 className="font-bold text-foreground flex items-center gap-2 text-sm">
                <ShieldAlert className="w-4 h-4 text-red-500" /> Reports Queue ({filteredReports.length})
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-border">
              {isLoading ? (
                <p className="p-6 text-center text-xs text-muted-foreground">Loading queue...</p>
              ) : filteredReports.length === 0 ? (
                <p className="p-6 text-center text-xs text-muted-foreground">No listing reports match this filter.</p>
              ) : (
                filteredReports.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => setActiveReportId(report.id)}
                    className={`p-4 cursor-pointer transition ${
                      selectedReport?.id === report.id
                        ? "bg-red-500/10 border-l-4 border-l-red-500 shadow-inner"
                        : "hover:bg-secondary border-l-4 border-l-transparent"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400">
                        {report.reason}
                      </span>
                      <span className={`text-[10px] font-bold uppercase ${
                        report.status === "OPEN" ? "text-amber-600" :
                        report.status === "REVIEWING" ? "text-blue-600" :
                        report.status === "RESOLVED" ? "text-emerald-600" : "text-slate-500"
                      }`}>
                        {report.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-foreground line-clamp-1 mt-1">
                      {report.property?.title || "Property Listing"}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      Agent: {report.property?.agent?.name || "Unknown"}
                    </p>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2">
                      <span>By: {report.reporter?.name || "Member"}</span>
                      <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Report Detail & Action Pane */}
          <div className="flex-1 flex flex-col bg-slate-50/5 dark:bg-slate-900/5">
            {selectedReport ? (
              <div className="flex-1 flex flex-col">
                <div className="p-6 border-b border-border bg-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold px-2.5 py-1 bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded-full">
                        Reason: {selectedReport.reason}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">
                        Reported on {new Date(selectedReport.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-foreground">
                      {selectedReport.property?.title || "Listing Review"}
                    </h2>
                  </div>
                  <Link href={`/member/listing/${selectedReport.propertyId}`} target="_blank">
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold">
                      View Listing <ArrowUpRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>

                <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-card border border-border p-4 rounded-xl">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Reporter</p>
                      <p className="font-semibold text-sm text-foreground">{selectedReport.reporter?.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedReport.reporter?.email}</p>
                    </div>
                    <div className="bg-card border border-border p-4 rounded-xl">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Listed Agent</p>
                      <p className="font-semibold text-sm text-foreground">{selectedReport.property?.agent?.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedReport.property?.agent?.email}</p>
                    </div>
                  </div>

                  <div className="bg-card border border-border p-5 rounded-2xl space-y-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Detailed Complaint</p>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap bg-secondary p-4 rounded-xl">
                      {selectedReport.details}
                    </p>
                  </div>
                </div>

                {/* Moderation Actions Footer */}
                <div className="p-4 bg-card border-t border-border flex flex-wrap items-center justify-between gap-4">
                  <div className="text-xs font-medium text-muted-foreground">
                    Current Status: <strong className="text-foreground uppercase">{selectedReport.status}</strong>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedReport.status !== "REVIEWING" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(selectedReport.id, "REVIEWING")}
                        className="text-xs font-bold text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        Mark Reviewing
                      </Button>
                    )}
                    {selectedReport.status !== "RESOLVED" && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(selectedReport.id, "RESOLVED")}
                        className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Resolve & Action
                      </Button>
                    )}
                    {selectedReport.status !== "DISMISSED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(selectedReport.id, "DISMISSED")}
                        className="text-xs font-bold text-slate-600 border-slate-200 hover:bg-slate-100 gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Dismiss
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <AlertTriangle className="w-12 h-12 text-slate-300 mb-2" />
                <p className="font-semibold text-sm">Select a report from the queue to inspect details.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
