"use client";

import { PageTransition } from "../../../components/layout/PageTransition";
import { MessageSquareWarning, Filter, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { useState } from "react";

export default function AdminDisputesPage() {
  const disputes = [
    { id: "TKT-001", reporter: "Samuel Ojo", against: "Sunshine Lodge", type: "False Advertising", status: "Open", date: "Oct 20, 2026", priority: "High" },
    { id: "TKT-002", reporter: "Comfort Villa", against: "Aisha Bello", type: "Property Damage", status: "In Progress", date: "Oct 18, 2026", priority: "Medium" },
    { id: "TKT-003", reporter: "Grace Okon", against: "Green Haven", type: "Refund Request", status: "Resolved", date: "Oct 10, 2026", priority: "Low" },
  ];

  const [activeTicket, setActiveTicket] = useState<string | null>("TKT-001");

  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dispute & Ticket Resolution</h1>
            <p className="text-slate-500 mt-1">Manage conflicts between members and agents.</p>
          </div>
          <Button variant="outline" className="bg-white rounded-xl shadow-sm">
             <Filter className="w-4 h-4 mr-2" /> Filter Tickets
          </Button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[600px]">
          {/* Ticket List */}
          <div className={`w-full md:w-1/3 border-r border-slate-100 flex flex-col ${activeTicket ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h2 className="font-bold text-slate-900 flex items-center gap-2"><MessageSquareWarning className="w-5 h-5 text-amber-500" /> Active Tickets</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {disputes.map((ticket, idx) => (
                <div key={idx} onClick={() => setActiveTicket(ticket.id)} className={`p-4 border-b border-slate-100 cursor-pointer transition ${activeTicket === ticket.id ? 'bg-amber-50/50 border-l-4 border-l-amber-500 shadow-inner' : 'hover:bg-slate-50 border-l-4 border-l-transparent'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-bold uppercase ${activeTicket === ticket.id ? 'text-amber-700' : 'text-slate-500'}`}>{ticket.id}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      ticket.priority === 'High' ? 'bg-red-100 text-red-700' :
                      ticket.priority === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                    }`}>{ticket.priority}</span>
                  </div>
                  <h3 className={`font-bold mb-1 ${activeTicket === ticket.id ? 'text-amber-900' : 'text-slate-900'}`}>{ticket.type}</h3>
                  <p className="text-sm text-slate-600 mb-2 line-clamp-1">{ticket.reporter} vs {ticket.against}</p>
                  <div className="flex justify-between items-center text-xs font-medium">
                    <span className={ticket.status === 'Resolved' ? 'text-green-600' : 'text-amber-600'}>{ticket.status}</span>
                    <span className="text-slate-400">{ticket.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ticket Detail & Chat */}
          <div className={`flex-1 flex flex-col bg-slate-50/50 ${activeTicket ? 'flex' : 'hidden md:flex'}`}>
            {activeTicket ? (
              <>
                 <div className="p-6 border-b border-slate-100 bg-white">
                   <div className="flex justify-between items-start mb-4">
                     <div className="flex items-start gap-2">
                       <Button variant="ghost" size="sm" className="md:hidden p-1 mt-0.5" onClick={() => setActiveTicket(null)}>
                         <ArrowLeft className="w-5 h-5 text-slate-600" />
                       </Button>
                       <div>
                         <h2 className="text-xl font-bold text-slate-900">False Advertising - Generator Not Working</h2>
                         <p className="text-sm text-slate-500 mt-1">Reported by Samuel Ojo against Sunshine Lodge</p>
                       </div>
                     </div>
                     <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white rounded-lg hidden sm:flex">
                       <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Resolved
                     </Button>
                   </div>
                   <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-sm text-amber-800">
                     <strong>User Claim:</strong> The listing stated 24/7 generator, but there has been no power for 3 days. The agent is unresponsive.
                   </div>
                 </div>
                 
                 <div className="flex-1 p-6 flex flex-col justify-end space-y-4 overflow-y-auto min-h-[300px]">
                    <div className="text-center">
                      <span className="bg-slate-200 text-slate-600 text-xs px-3 py-1 rounded-full font-medium">Oct 20, 2026</span>
                    </div>
                    <div className="self-start max-w-[80%] bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-sm shadow-sm text-sm text-slate-700">
                      <p className="font-bold text-slate-900 text-xs mb-1">Samuel Ojo</p>
                      I want a partial refund for the days I didn't have power.
                    </div>
                    <div className="self-end max-w-[80%] bg-blue-600 text-white p-4 rounded-2xl rounded-tr-sm shadow-sm text-sm">
                      <p className="font-bold text-blue-100 text-xs mb-1">System Admin (You)</p>
                      We have reached out to Sunshine Lodge. If they do not respond within 24 hours, we will force a partial refund from their escrow balance.
                    </div>
                 </div>

                 <div className="p-4 bg-white border-t border-slate-200 flex flex-col">
                    <textarea 
                      placeholder="Type a message to both parties (they will both see this)..." 
                      className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#008A4B]/20 focus:border-[#008A4B] transition resize-none h-24 text-sm"
                    ></textarea>
                    <div className="flex justify-between items-center mt-3">
                      <Button variant="ghost" className="text-green-600 hover:bg-green-50 rounded-xl hidden sm:flex lg:hidden">
                         <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Resolved
                      </Button>
                      <Button variant="outline" className="border-green-200 text-green-700 hover:bg-green-50 rounded-xl hidden lg:flex">
                         <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Resolved
                      </Button>
                      <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-6 ml-auto">Send Message</Button>
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
