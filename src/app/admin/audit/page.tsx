"use client";

import { PageTransition } from "../../../components/layout/PageTransition";
import { ShieldAlert, History, Search, RefreshCw } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { useState, useEffect } from "react";
import { getAdminAuditLogs } from "../../actions/audit";
import { toast } from "sonner";

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const loadLogs = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await getAdminAuditLogs();
      setLogs(data);
    } catch (err) {
      if (!silent) toast.error("Failed to fetch audit logs");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    const interval = setInterval(() => loadLogs(true), 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter(l => 
    l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.details && l.details.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <History className="w-6 h-6 text-emerald-600" /> Audit & Activity Logs
            </h1>
            <p className="text-muted-foreground mt-1">Real-time security trail tracking role changes, bans, listing modifications, and admin actions.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Tracking
            </span>
            <Button variant="outline" size="sm" onClick={() => loadLogs()} className="gap-2">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm p-4 space-y-4">
          <div className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-xl border border-border">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search audit actions, targets, or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-sm w-full focus:outline-none text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-xs font-bold text-muted-foreground uppercase tracking-wider bg-secondary/50">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Target ID / Entity</th>
                  <th className="p-3">Details</th>
                  <th className="p-3">Actor (User ID)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">Loading audit records...</td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">No audit logs found.</td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-secondary/30 transition">
                      <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="p-3 font-semibold text-foreground">
                        <span className="px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-xs text-muted-foreground">{log.target}</td>
                      <td className="p-3 text-xs text-foreground max-w-xs truncate" title={log.details}>
                        {log.details || "N/A"}
                      </td>
                      <td className="p-3 font-mono text-xs text-muted-foreground">{log.userId || "System"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
