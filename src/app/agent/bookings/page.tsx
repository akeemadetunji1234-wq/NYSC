"use client";

import { PageTransition } from "../../../components/layout/PageTransition";
import { Search, Filter, CheckCircle, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../../../components/ui/button";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

import { getAgentBookings, updateBookingStatus } from "../../actions/agent";

export default function AgentBookingsPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function fetchBookings() {
      if (!userId) return;
      const data = await getAgentBookings(userId);
      setAllBookings(data);
      setIsLoading(false);
    }
    fetchBookings();
  }, [userId]);

  const handleUpdateStatus = async (id: string, status: "ACCEPTED" | "DECLINED") => {
    await updateBookingStatus(id, status);
    setAllBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  };

  const [statusFilter, setStatusFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);

  const filteredBookings = allBookings.filter(b => statusFilter === "All" || b.status === statusFilter);

  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Bookings</h1>
            <p className="text-muted-foreground mt-1">Manage all your guest reservations.</p>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border flex flex-col gap-4 bg-secondary">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center w-full">
              <div className="relative w-full sm:w-96">
                <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search guest or booking ID..." 
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition bg-card"
                />
              </div>
              <Button onClick={() => setShowFilters(!showFilters)} variant="outline" className={`rounded-xl w-full sm:w-auto bg-card ${showFilters ? 'border-blue-600 text-blue-600' : ''}`}>
                <Filter className="w-4 h-4 mr-2" /> Filters
              </Button>
            </div>
            
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border animate-in slide-in-from-top-2 duration-200">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Status</label>
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full p-2 border border-border rounded-lg text-sm bg-card"
                  >
                    <option value="All">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="ACCEPTED">Confirmed</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="DECLINED">Declined</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Date Range</label>
                  <div className="flex gap-2">
                    <input type="date" className="w-full p-2 border border-border rounded-lg text-sm bg-card" />
                    <span className="self-center text-slate-400">-</span>
                    <input type="date" className="w-full p-2 border border-border rounded-lg text-sm bg-card" />
                  </div>
                </div>
                <div className="flex items-end">
                   <Button variant="ghost" onClick={() => setStatusFilter("All")} className="text-muted-foreground hover:text-slate-900 text-sm">Clear Filters</Button>
                </div>
              </div>
            )}
          </div>
          
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/50 text-muted-foreground font-medium">
                <tr>
                  <th className="px-6 py-4">Booking ID</th>
                  <th className="px-6 py-4">Guest</th>
                  <th className="px-6 py-4">Property</th>
                  <th className="px-6 py-4">Dates</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">Loading bookings...</td></tr>
                ) : filteredBookings.length > 0 ? filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-secondary transition group">
                    <td className="px-6 py-4">
                      <Link href={`#${booking.id}`} className="font-bold text-foreground group-hover:text-blue-600 transition">
                        {booking.id.slice(-6).toUpperCase()}
                      </Link>
                    </td>
                    <td className="px-6 py-4 font-medium text-muted-foreground">
                      <Link href={`#${booking.corpMemberId}`} className="hover:underline decoration-slate-400 underline-offset-2">
                        {booking.corpMember?.name || "Guest"}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{booking.property?.title}</td>
                    <td className="px-6 py-4 text-muted-foreground">{new Date(booking.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-medium text-foreground">₦{(booking.amount || 0).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        booking.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-700' :
                        booking.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                        booking.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {booking.status === 'ACCEPTED' ? 'Confirmed' :
                         booking.status === 'PENDING' ? 'Pending' :
                         booking.status === 'COMPLETED' ? 'Completed' : 'Declined'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {booking.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" onClick={() => handleUpdateStatus(booking.id, "ACCEPTED")} className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-3">
                            <CheckCircle className="w-4 h-4 mr-1" /> Approve
                          </Button>
                          <Button size="sm" onClick={() => handleUpdateStatus(booking.id, "DECLINED")} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 rounded-lg px-3">
                            <XCircle className="w-4 h-4 mr-1" /> Decline
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="ghost" className="text-blue-600 hover:bg-blue-50 rounded-lg">
                          View Details
                        </Button>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                      No bookings found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          <div className="p-4 border-t border-border flex items-center justify-between bg-card">
            <span className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">1</span> to <span className="font-medium text-foreground">{filteredBookings.length}</span> of <span className="font-medium text-foreground">{filteredBookings.length}</span> results
            </span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="w-8 h-8 p-0 rounded-lg" disabled>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" className="w-8 h-8 p-0 rounded-lg bg-blue-50 text-blue-600 border-blue-200">
                1
              </Button>
              <Button variant="outline" size="sm" className="w-8 h-8 p-0 rounded-lg" disabled>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
