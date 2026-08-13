"use client";

import { PageTransition } from "../../../components/layout/PageTransition";
import { MessageSquareWarning, ArrowLeft, Send, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { useState, useEffect } from "react";
import { getAdminDisputes, respondToDispute } from "../../actions/dispute";
import { toast } from "sonner";

export default function AdminDisputesPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [responseText, setResponseText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadDisputes = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await getAdminDisputes();
      setTickets(data);
      if (data.length > 0 && !activeTicketId && !silent) {
        setActiveTicketId(data[0].id);
      }
    } catch (err) {
      if (!silent) toast.error("Failed to load disputes queue");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDisputes();

    // Polling for real-time updates every 3 seconds
    const interval = setInterval(() => {
      loadDisputes(true);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleRespond = async (id: string, resolve: boolean) => {
    if (!responseText.trim() && !resolve) return;
    
    setIsSubmitting(true);
    try {
      await respondToDispute(id, responseText, resolve);
      toast.success(resolve ? "Dispute marked as resolved." : "Response sent.");
      if (resolve) setResponseText("");
      await loadDisputes(true);
    } catch (err) {
      toast.error("Failed to process dispute action");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTicket = tickets.find(t => t.id === activeTicketId);

  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dispute & Ticket Resolution</h1>
            <p className="text-muted-foreground mt-1">Manage conflicts between members and agents in real-time.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync
            </span>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[600px]">
          {/* Ticket List */}
          <div className={`w-full md:w-1/3 border-r border-border flex flex-col ${activeTicketId ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b border-border bg-secondary">
              <h2 className="font-bold text-foreground flex items-center gap-2">
                <MessageSquareWarning className="w-5 h-5 text-amber-500" /> Active Tickets ({tickets.length})
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <p className="p-6 text-center text-xs text-muted-foreground">Loading queue...</p>
              ) : tickets.length === 0 ? (
                <p className="p-6 text-center text-xs text-muted-foreground">No active disputes reported.</p>
              ) : (
                tickets.map((ticket, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setActiveTicketId(ticket.id)} 
                    className={`p-4 border-b border-border cursor-pointer transition ${activeTicketId === ticket.id ? 'bg-amber-500/10 border-l-4 border-l-amber-500 shadow-inner' : 'hover:bg-secondary border-l-4 border-l-transparent'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[10px] font-bold uppercase ${activeTicketId === ticket.id ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground'}`}>{ticket.ticketNo}</span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        ticket.priority === 'High' ? 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400' :
                        ticket.priority === 'Medium' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400' : 
                        'bg-secondary text-muted-foreground'
                      }`}>{ticket.priority}</span>
                    </div>
                    <h3 className={`font-bold text-sm mb-1 ${activeTicketId === ticket.id ? 'text-amber-900 dark:text-amber-100' : 'text-foreground'}`}>{ticket.type}</h3>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{ticket.reporter} vs {ticket.agentName}</p>
                    <div className="flex justify-between items-center text-[10px] font-medium">
                      <span className={ticket.status === 'RESOLVED' ? 'text-green-600' : 'text-amber-600'}>{ticket.status}</span>
                      <span className="text-slate-400">{ticket.date}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Ticket Detail & Chat */}
          <div className={`flex-1 flex flex-col bg-slate-50/5 dark:bg-slate-900/5 ${activeTicketId ? 'flex' : 'hidden md:flex'}`}>
            {selectedTicket ? (
              <>
                 <div className="p-6 border-b border-border bg-card">
                   <div className="flex justify-between items-start mb-4">
                     <div className="flex items-start gap-2">
                       <Button variant="ghost" size="sm" className="md:hidden p-1 mt-0.5" onClick={() => setActiveTicketId(null)}>
                         <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                       </Button>
                       <div>
                         <h2 className="text-xl font-bold text-foreground">{selectedTicket.type}</h2>
                         <p className="text-sm text-muted-foreground mt-1">Reported by {selectedTicket.reporter} against {selectedTicket.against} (Agent: {selectedTicket.agentName})</p>
                       </div>
                     </div>
                     <span className="text-xs font-bold px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full border border-amber-500/20">
                       Amount: ₦{selectedTicket.amount.toLocaleString()}
                     </span>
                   </div>
                 </div>
                 
                 <div className="flex-1 p-6 flex flex-col space-y-4 overflow-y-auto">
                    <div className="text-center">
                      <span className="bg-secondary text-muted-foreground text-xs px-3 py-1 rounded-full font-medium">{selectedTicket.date}</span>
                    </div>
                    
                    {/* User's Original Complaint */}
                    <div className="self-start max-w-[80%] bg-card border border-border p-4 rounded-2xl rounded-tl-sm shadow-sm text-sm text-muted-foreground">
                      <p className="font-bold text-foreground text-xs mb-1">{selectedTicket.reporter} (User)</p>
                      {selectedTicket.description}
                    </div>

                    {/* Admin Response if it exists */}
                    {selectedTicket.adminResponse && (
                      <div className="self-end max-w-[80%] bg-blue-600 text-white p-4 rounded-2xl rounded-tr-sm shadow-sm text-sm">
                        <p className="font-bold text-blue-100 text-xs mb-1">System Admin (You)</p>
                        {selectedTicket.adminResponse}
                      </div>
                    )}
                 </div>

                 {/* Response Input */}
                 <div className="p-4 bg-card border-t border-border flex flex-col gap-3">
                   {selectedTicket.status !== "RESOLVED" ? (
                     <>
                       <div className="flex gap-2">
                         <textarea 
                           className="w-full text-sm p-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-[#008A4B]/50 resize-none bg-secondary"
                           placeholder="Type your response to the user..."
                           rows={2}
                           value={responseText}
                           onChange={e => setResponseText(e.target.value)}
                           disabled={isSubmitting}
                         />
                       </div>
                       <div className="flex justify-between items-center gap-3">
                         <Button 
                           onClick={() => handleRespond(selectedTicket.id, true)}
                           disabled={isSubmitting}
                           variant="outline"
                           className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 rounded-xl text-xs"
                         >
                            <CheckCircle2 className="w-4 h-4 mr-1" /> Mark Resolved
                         </Button>
                         
                         <Button 
                           onClick={() => handleRespond(selectedTicket.id, false)}
                           disabled={!responseText.trim() || isSubmitting}
                           className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs flex items-center gap-2"
                         >
                            <Send className="w-3.5 h-3.5" /> Send Response
                         </Button>
                       </div>
                     </>
                   ) : (
                     <div className="text-center p-3 text-sm font-semibold text-emerald-600 bg-emerald-50 rounded-xl border border-emerald-100">
                       This dispute has been marked as resolved.
                     </div>
                   )}
                 </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                 <MessageSquareWarning className="w-12 h-12 mb-4 opacity-20" />
                 <p>Select a ticket to view details and start mediating</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
