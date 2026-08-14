"use client";

import { useState, useEffect } from "react";
import { FileText, Check } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "../../components/ui/button";
import { Skeleton } from "../../components/ui/skeleton";
import { ErrorState, EmptyState } from "../../components/shared/States";
import { toast } from "sonner";
import confetti from "canvas-confetti";

import { getUnverifiedAgents, verifyAgent, rejectAgent } from "../../app/actions/admin";

interface Application {
  id: string;
  name: string;
  location: string;
  submittedAt: string;
  docType: string;
  docNumber: string;
  documentAvailable: boolean;
  agency: string;
  experience: string;
  bio: string;
  operatingStates: string[];
  initial: string;
  color: string;
}

export function AgentVerificationList() {
  const [data, setData] = useState<Application[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeDoc, setActiveDoc] = useState<Application | null>(null);

  const fetchApplications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const agents = await getUnverifiedAgents();
      
      const mappedData = agents.map((agent: any) => ({
        id: agent.id,
        name: agent.name || "Unknown Agent",
        location: agent.state ? `${agent.state}` : "Location not provided",
        submittedAt: `Registered ${new Date(agent.createdAt).toLocaleDateString()}`,
        docType: agent.docType || "NIN Slip",
        docNumber: agent.docNumber || "N/A",
        documentAvailable: Boolean(agent.documentAvailable),
        agency: agent.agency || "Independent Agent",
        experience: agent.experience || "N/A",
        bio: agent.bio || "No bio provided",
        operatingStates: agent.operatingStates || [],
        initial: (agent.name || "A").charAt(0).toUpperCase(),
        color: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"
      }));

      setData(mappedData);
    } catch (err: any) {
      setError("Failed to fetch applications.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleReject = async (id: string, name: string) => {
    if (!data) return;
    try {
      await rejectAgent(id);
      setData(data.filter(app => app.id !== id));
      toast.error(`Application for ${name} has been rejected.`);
    } catch (err) {
      toast.error("Failed to reject agent.");
    }
  };

  const handleVerify = async (id: string, name: string) => {
    if (!data) return;
    try {
      await verifyAgent(id);
      setData(data.filter(app => app.id !== id));
      toast.success(`${name} has been successfully verified!`);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err) {
      toast.error("Failed to verify agent.");
    }
  };

  if (error) {
    return <ErrorState onRetry={fetchApplications} />;
  }

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
      <div className="px-6 py-4 border-b border-border bg-secondary">
        <h2 className="font-semibold text-foreground">Pending Applications</h2>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-full shrink-0" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-24 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-full" />
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-10 w-20 rounded-xl" />
                <Skeleton className="h-10 w-32 rounded-xl" />
              </div>
            </div>
          ))
        ) : data?.length === 0 ? (
          <div className="p-10">
            <EmptyState icon={Check} title="All Caught Up!" description="There are no pending agent verifications at this time." />
          </div>
        ) : (
          data?.map((app, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={app.id}
              className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${app.color}`}>
                  {app.initial}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-lg">{app.name}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{app.location} &bull; {app.submittedAt}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button 
                  onClick={() => setActiveDoc(app)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground rounded-full text-xs font-medium border border-border cursor-pointer transition"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  {app.docType}
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <Button 
                  onClick={() => handleReject(app.id, app.name)}
                  variant="outline" 
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 rounded-xl"
                >
                  Reject
                </Button>
                <Button 
                  onClick={() => handleVerify(app.id, app.name)}
                  className="bg-[#008A4B] hover:bg-[#006F3C] flex items-center justify-center gap-2 rounded-xl text-white"
                >
                  <Check className="w-4 h-4" />
                  Verify Agent
                </Button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Document Preview Modal */}
      {activeDoc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-xl rounded-2xl overflow-hidden border border-border shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-border flex justify-between items-center bg-secondary">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" /> {activeDoc.docType} & Profile
              </h3>
              <button 
                onClick={() => setActiveDoc(null)}
                className="p-1 rounded-lg hover:bg-card text-muted-foreground hover:text-foreground transition"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-secondary/20 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Agency</p>
                    <p className="text-sm font-bold">{activeDoc.agency}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Experience</p>
                    <p className="text-sm font-bold">{activeDoc.experience}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Operating States</p>
                    <p className="text-xs font-medium">{activeDoc.operatingStates.join(", ")}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">{activeDoc.docType} Number</p>
                    <p className="text-sm font-bold">{activeDoc.docNumber}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Bio</p>
                    <p className="text-[11px] leading-relaxed line-clamp-4">{activeDoc.bio}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Verification Document</p>
                {activeDoc.documentAvailable ? (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-border shadow-sm bg-white">
                    <img
                      src={`/api/admin/verification-document?userId=${encodeURIComponent(activeDoc.id)}`}
                      alt="Verification Document"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-video rounded-xl border border-dashed border-border flex items-center justify-center text-muted-foreground text-xs italic bg-secondary/30">
                    No document image uploaded
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-border flex justify-end gap-3 bg-secondary">
              <Button 
                onClick={() => setActiveDoc(null)}
                variant="outline"
                className="rounded-xl text-xs h-9"
              >
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

