"use client";

import { useState, useEffect } from "react";
import { FileText, Check } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "../../components/ui/button";
import { Skeleton } from "../../components/ui/skeleton";
import { ErrorState, EmptyState } from "../../components/shared/States";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface Application {
  id: number;
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

  const fetchApplications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Simulating API call latency
      await new Promise((resolve) => setTimeout(resolve, 1500));
      // Mock data payload
      const mockData = [
        { id: 1, name: "Chinedu Okafor", location: "Lagos", submittedAt: "Submitted 2h ago", documents: ["NIN_Card.pdf", "CAC_Reg.pdf"], initial: "C", color: "bg-blue-100 text-blue-700" },
        { id: 2, name: "Amina Mohammed", location: "Abuja", submittedAt: "Submitted 5h ago", documents: ["NIN_Card.pdf", "CAC_Reg.pdf"], initial: "A", color: "bg-purple-100 text-purple-700" },
        { id: 3, name: "Samuel Adeyemi", location: "Ibadan", submittedAt: "Submitted 1 day ago", documents: ["NIN_Card.pdf", "CAC_Reg.pdf"], initial: "S", color: "bg-amber-100 text-amber-700" },
      ];
      setData(mockData);
    } catch (err: any) {
      setError("Failed to fetch applications.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleReject = (id: number, name: string) => {
    if (!data) return;
    setData(data.filter(app => app.id !== id));
    toast.error(`Application for ${name} has been rejected.`);
  };

  const handleVerify = (id: number, name: string) => {
    if (!data) return;
    setData(data.filter(app => app.id !== id));
    toast.success(`${name} has been successfully verified!`);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  if (error) {
    return <ErrorState onRetry={fetchApplications} />;
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
        <h2 className="font-semibold text-slate-800">Pending Applications</h2>
      </div>

      <div className="divide-y divide-slate-100">
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
              className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${app.color}`}>
                  {app.initial}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-lg">{app.name}</h3>
                  <p className="text-sm text-slate-500 mt-0.5">{app.location} &bull; {app.submittedAt}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {app.documents.map((doc) => (
                  <span key={doc} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium border border-slate-200">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    {doc}
                  </span>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <Button 
                  onClick={() => handleReject(app.id, app.name)}
                  variant="outline" 
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                >
                  Reject
                </Button>
                <Button 
                  onClick={() => handleVerify(app.id, app.name)}
                  className="bg-[#008A4B] hover:bg-[#006F3C] flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Verify Agent
                </Button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

