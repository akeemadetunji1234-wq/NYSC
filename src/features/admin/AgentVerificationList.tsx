"use client";

import { useState, useEffect } from "react";
import { FileText, Check } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "../../components/ui/button";
import { Skeleton } from "../../components/ui/skeleton";
import { ErrorState, EmptyState } from "../../components/shared/States";
import { toast } from "sonner";
import confetti from "canvas-confetti";

import { getUnverifiedAgents, verifyAgent } from "../../app/actions/admin";

interface Application {
  id: string;
  name: string;
  location: string;
  submittedAt: string;
  documents: string[];
  initial: string;
  color: string;
}

export function AgentVerificationList() {
  const [data, setData] = useState<Application[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeDoc, setActiveDoc] = useState<{ type: string; agentName: string } | null>(null);

  const fetchApplications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const agents = await getUnverifiedAgents();
      
      const mappedData = agents.map((agent: any) => ({
        id: agent.id,
        name: agent.name || "Unknown Agent",
        location: agent.state ? `${agent.state}` : "Lagos, Nigeria",
        submittedAt: `Registered ${new Date(agent.createdAt).toLocaleDateString()}`,
        documents: ["NIN_Card.pdf", "CAC_Reg.pdf"],
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

  const handleReject = (id: string, name: string) => {
    if (!data) return;
    setData(data.filter(app => app.id !== id));
    toast.error(`Application for ${name} has been rejected.`);
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
                {app.documents.map((doc) => (
                  <button 
                    key={doc} 
                    onClick={() => setActiveDoc({ type: doc, agentName: app.name })}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground rounded-full text-xs font-medium border border-border cursor-pointer transition"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    {doc}
                  </button>
                ))}
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
                <FileText className="w-5 h-5 text-blue-600" /> {activeDoc.type} Preview
              </h3>
              <button 
                onClick={() => setActiveDoc(null)}
                className="p-1 rounded-lg hover:bg-card text-muted-foreground hover:text-foreground transition"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex items-center justify-center bg-secondary/20">
              {activeDoc.type.includes("NIN") ? (
                /* NIN CARD MOCKUP */
                <div className="w-full max-w-sm aspect-[1.6/1] bg-gradient-to-br from-green-500/10 via-emerald-100/30 to-green-500/10 border border-green-500/30 rounded-xl p-4 shadow-md flex flex-col justify-between relative overflow-hidden text-slate-800">
                  <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#008a4b_1px,transparent_1px)] [background-size:16px_16px]"></div>
                  
                  {/* Header */}
                  <div className="flex justify-between items-start border-b border-green-500/20 pb-2 relative z-10">
                    <span className="text-[14px] font-bold text-emerald-800 leading-tight">FEDERAL REPUBLIC OF NIGERIA</span>
                    <span className="text-[8px] bg-green-700 text-white font-bold px-1 py-0.5 rounded">NIN</span>
                  </div>

                  {/* Body details */}
                  <div className="flex gap-4 items-center my-3 relative z-10">
                    <div className="w-16 h-20 bg-slate-300 dark:bg-slate-700 rounded border border-green-500/20 flex items-center justify-center font-bold text-slate-500">
                      PHOTO
                    </div>
                    <div className="flex-1 space-y-1.5 text-left">
                      <div className="text-[9px]">
                        <p className="text-muted-foreground uppercase leading-none font-bold">Surname</p>
                        <p className="font-bold text-slate-800 text-xs mt-0.5">{activeDoc.agentName.split(" ").slice(-1)[0] || "Doe"}</p>
                      </div>
                      <div className="text-[9px]">
                        <p className="text-muted-foreground uppercase leading-none font-bold">Given Names</p>
                        <p className="font-bold text-slate-800 text-xs mt-0.5">{activeDoc.agentName.split(" ").slice(0, -1).join(" ") || "John"}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[9px]">
                        <div>
                          <p className="text-muted-foreground uppercase leading-none font-bold">Gender</p>
                          <p className="font-bold text-slate-800 mt-0.5">M</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground uppercase leading-none font-bold">Issue Date</p>
                          <p className="font-bold text-slate-800 mt-0.5">12/04/2025</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* NIN Code Footer */}
                  <div className="border-t border-green-500/20 pt-2 flex justify-between items-center relative z-10">
                    <span className="text-[9px] text-muted-foreground">National Identification Number (NIN)</span>
                    <span className="text-xs font-extrabold tracking-widest text-emerald-800">
                      {Math.floor(1000 + Math.random() * 9000)} {Math.floor(1000 + Math.random() * 9000)} {Math.floor(10 + Math.random() * 90)}
                    </span>
                  </div>
                </div>
              ) : (
                /* CAC MOCKUP */
                <div className="w-full max-w-sm aspect-[1/1.3] bg-amber-50/10 border-2 border-amber-600/30 rounded-xl p-6 shadow-md flex flex-col justify-between relative overflow-hidden text-slate-800 bg-[radial-gradient(#d97706_0.5px,transparent_0.5px)] [background-size:24px_24px] [background-opacity:0.02]">
                  {/* Seal watermark */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                    <div className="w-48 h-48 rounded-full border-4 border-amber-800 flex items-center justify-center font-bold text-2xl">CAC SEAL</div>
                  </div>

                  {/* Header */}
                  <div className="text-center border-b-2 border-amber-600/20 pb-4">
                    <h4 className="text-xs font-extrabold text-amber-900 tracking-wider">CORPORATE AFFAIRS COMMISSION</h4>
                    <p className="text-[9px] font-bold text-amber-800">FEDERAL REPUBLIC OF NIGERIA</p>
                    <div className="mt-2 text-[10px] font-bold uppercase text-amber-700 bg-amber-100/50 py-0.5 px-2 rounded inline-block">
                      RC NO: {Math.floor(1000000 + Math.random() * 9000000)}
                    </div>
                  </div>

                  {/* Body text */}
                  <div className="flex-1 my-6 flex flex-col justify-center text-center space-y-4">
                    <p className="text-[10px] font-medium italic text-slate-600 leading-normal">
                      This is to certify that
                    </p>
                    <p className="text-sm font-extrabold text-amber-950 uppercase tracking-wide">
                      {activeDoc.agentName.toUpperCase()} PROPERTIES LTD
                    </p>
                    <p className="text-[10px] font-medium text-slate-600 leading-relaxed px-4">
                      is this day incorporated under the COMPANIES AND ALLIED MATTERS ACT 2020 and that the Company is Limited by Shares.
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="border-t border-amber-600/20 pt-4 flex justify-between items-end">
                    <div className="text-left">
                      <p className="text-[7px] text-muted-foreground uppercase">Given under my hand at Abuja</p>
                      <p className="text-[9px] font-bold text-slate-800">22nd October 2025</p>
                    </div>
                    <div className="text-center">
                      <div className="w-10 h-10 rounded-full border-2 border-dashed border-amber-600/50 flex items-center justify-center text-[8px] font-extrabold text-amber-700 mb-1">
                        SEAL
                      </div>
                      <p className="text-[6px] text-muted-foreground uppercase font-bold">Registrar General</p>
                    </div>
                  </div>
                </div>
              )}
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

