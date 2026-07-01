"use client";

import { useEffect, useState } from "react";
import { getAgents, verifyAgent } from "../../actions/admin";
import { CheckCircle, XCircle, Shield, AlertTriangle } from "lucide-react";
import { Button } from "../../../components/ui/button";

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgents();
  }, []);

  async function loadAgents() {
    setLoading(true);
    const data = await getAgents();
    setAgents(data);
    setLoading(false);
  }

  async function handleVerify(id: string, verify: boolean) {
    if (!confirm(`Are you sure you want to ${verify ? 'verify' : 'unverify'} this agent?`)) return;
    await verifyAgent(id, verify);
    await loadAgents();
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Agent Verification</h1>
        <p className="text-muted-foreground mt-1">Review and verify new agent registrations.</p>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary text-muted-foreground border-b border-border">
              <tr>
                <th className="px-6 py-4">Agent Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Properties</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">Loading agents...</td></tr>
              ) : agents.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">No agents registered.</td></tr>
              ) : agents.map((agent) => (
                <tr key={agent.id} className="hover:bg-secondary transition">
                  <td className="px-6 py-4 font-bold text-foreground">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0">
                        {agent.image ? <img src={agent.image} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center font-bold text-muted-foreground text-xs">A</div>}
                      </div>
                      {agent.name || "Unknown Agent"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{agent.email}</td>
                  <td className="px-6 py-4">
                    {agent.agentVerified ? (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max">
                        <CheckCircle className="w-3 h-3"/> Verified
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max">
                        <AlertTriangle className="w-3 h-3"/> Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-muted-foreground">{agent._count.properties}</td>
                  <td className="px-6 py-4 text-right">
                    {!agent.agentVerified ? (
                      <Button size="sm" onClick={() => handleVerify(agent.id, true)} className="bg-green-600 hover:bg-green-700 text-white rounded-lg">
                        <Shield className="w-4 h-4 mr-2"/> Verify Agent
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => handleVerify(agent.id, false)} variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200 rounded-lg">
                        <XCircle className="w-4 h-4 mr-2"/> Revoke
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
