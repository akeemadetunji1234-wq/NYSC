"use client";

import { PageTransition } from "../../../components/layout/PageTransition";
import { MessageSquareWarning, Filter, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { useState, useEffect } from "react";
import { getAdminDisputes, resolveDispute } from "../../actions/admin";
import { toast } from "sonner";

export default function AdminDisputesPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDisputes = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminDisputes();
      setTickets(data);
      if (data.length > 0 && !activeTicketId) {
        setActiveTicketId(data[0].id);
      }
    } catch (err) {
      toast.error("Failed to load disputes queue");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDisputes();
  }, []);

  const handleResolve = async (id: string) => {
    try {
      await resolveDispute(id, "PAYOUT");
      toast.success("Dispute marked as resolved successfully.");
      loadDisputes();
    } catch (err) {
      toast.error("Failed to resolve dispute");
    }
  };

  const selectedTicket = tickets.find(t => t.id === activeTicketId);

  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dispute & Ticket Resolution</h1>
            <p className="text-muted-foreground mt-1">Manage conflicts between members and agents.</p>
          </div>
          <Button variant="outline" className="bg-card rounded-xl shadow-sm" onClick={loadDisputes}>
             Refresh Tickets
          </Button>
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
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{ticket.reporter} vs {ticket.against}</p>
                    <div className="flex justify-between items-center text-[10px] font-medium">
                      <span className={ticket.status === 'Resolved' || ticket.status === 'Refunded' ? 'text-green-600' : 'text-amber-600'}>{ticket.status}</span>
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
                   <div className="p-4 bg-amber-500/10 dark:bg-amber-950/20 rounded-xl border border-amber-500/20 text-sm text-foreground">
                     <strong>Incident Log:</strong> {selectedTicket.description}
                   </div>
                 </div>
                 
                 <div className="flex-1 p-6 flex flex-col justify-end space-y-4 overflow-y-auto min-h-[300px]">
                    <div className="text-center">
                      <span className="bg-secondary text-muted-foreground text-xs px-3 py-1 rounded-full font-medium">{selectedTicket.date}</span>
                    </div>
                    <div className="self-start max-w-[80%] bg-card border border-border p-4 rounded-2xl rounded-tl-sm shadow-sm text-sm text-muted-foreground">
                      <p className="font-bold text-foreground text-xs mb-1">{selectedTicket.reporter}</p>
                      Hello Admin, I just got to the lodge and the host is not replying, plus the listing amenities are false. I want a refund.
                    </div>
                    <div className="self-end max-w-[80%] bg-blue-600 text-white p-4 rounded-2xl rounded-tr-sm shadow-sm text-sm">
                      <p className="font-bold text-blue-100 text-xs mb-1">System Admin (You)</p>
                      We have received your dispute ticket. We are checking the agent verification records and will issue a refund if the agent does not resolve this immediately.
                    </div>
                 </div>

                 <div className="p-4 bg-card border-t border-border flex flex-col">
                     <div className="flex justify-between items-center gap-3">
                       {selectedTicket.status !== "Resolved" && selectedTicket.status !== "Refunded" && (
                         <div className="flex gap-2 w-full sm:w-auto">
                           <Button 
                             onClick={() => handleResolve(selectedTicket.id)}
                             className="bg-[#008A4B] hover:bg-[#006F3C] text-white rounded-xl text-xs"
                           >
                              Mark Dispute as Resolved
                           </Button>
                         </div>
                       )}
                      {activeTicketId && (
                        <Button 
                          onClick={() => setActiveTicketId(null)}
                          variant="outline"
                          className="rounded-xl px-6 ml-auto text-xs"
                        >
                          Back to Queue
                        </Button>
                      )}
                    </div>
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
