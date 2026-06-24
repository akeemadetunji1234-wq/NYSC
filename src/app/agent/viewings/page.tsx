"use client";

import { useEffect, useState } from "react";
import { getAgentViewings, updateViewingStatus } from "../../actions/viewing";
import { useSession } from "next-auth/react";
import { PageTransition } from "../../../components/layout/PageTransition";
import { CheckCircle, XCircle, Calendar, Clock, MapPin, Search } from "lucide-react";
import { Button } from "../../../components/ui/button";
import Image from "next/image";

export default function AgentViewingsPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  const [viewings, setViewings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadViewings();
    }
  }, [userId]);

  async function loadViewings() {
    setLoading(true);
    try {
      const data = await getAgentViewings(userId);
      setViewings(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate(id: string, status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED") {
    try {
      await updateViewingStatus(id, status);
      await loadViewings();
    } catch (error) {
      alert("Failed to update status");
    }
  }

  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Property Viewings</h1>
          <p className="text-slate-500 mt-1">Manage physical inspection requests from prospective tenants.</p>
        </div>

        {/* Viewings List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Loading viewings...</div>
          ) : viewings.length === 0 ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center">
              <Calendar className="w-12 h-12 text-slate-300 mb-4" />
              <p>No viewing requests yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {viewings.map((viewing) => (
                <div key={viewing.id} className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center hover:bg-slate-50 transition">
                  <div className="flex gap-4 items-center w-full md:w-auto flex-1">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 relative">
                       {viewing.property.images?.[0] ? (
                         <Image src={viewing.property.images[0]} alt={viewing.property.title} fill className="object-cover" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center"><MapPin className="w-6 h-6 text-slate-400" /></div>
                       )}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg line-clamp-1">{viewing.property.title}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-500 font-medium">
                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(viewing.date).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {viewing.time}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">Requested by: <span className="font-bold text-slate-700">{viewing.corpMember.name || viewing.corpMember.email}</span></p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:items-end gap-3 w-full md:w-auto">
                    {viewing.status === "PENDING" && (
                      <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold inline-block">Pending Confirmation</span>
                    )}
                    {viewing.status === "CONFIRMED" && (
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold inline-block">Confirmed</span>
                    )}
                    {viewing.status === "COMPLETED" && (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold inline-block">Completed</span>
                    )}
                    {viewing.status === "CANCELLED" && (
                      <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold inline-block">Cancelled</span>
                    )}

                    {viewing.status === "PENDING" && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleStatusUpdate(viewing.id, "CONFIRMED")} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                          Accept
                        </Button>
                        <Button size="sm" onClick={() => handleStatusUpdate(viewing.id, "CANCELLED")} variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200 rounded-lg">
                          Decline
                        </Button>
                      </div>
                    )}

                    {viewing.status === "CONFIRMED" && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleStatusUpdate(viewing.id, "COMPLETED")} className="bg-green-600 hover:bg-green-700 text-white rounded-lg">
                          Mark Completed
                        </Button>
                        <Button size="sm" onClick={() => handleStatusUpdate(viewing.id, "CANCELLED")} variant="ghost" className="text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg">
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
