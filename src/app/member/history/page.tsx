"use client";

import { PageTransition } from "../../../components/layout/PageTransition";
import { Calendar, MapPin, CheckCircle2, Star, Clock, Flag, X, Loader2 } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getMemberBookings, getSavedLodges } from "../../actions/member";
import { getMemberViewings, cancelViewing } from "../../actions/viewing";
import { createDispute } from "../../actions/dispute";
import { useSession } from "next-auth/react";

export default function MemberHistoryPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  const [activeTab, setActiveTab] = useState("upcoming");
  const [bookings, setBookings] = useState<any[]>([]);
  const [savedLodges, setSavedLodges] = useState<any[]>([]);
  const [viewings, setViewings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [disputeStay, setDisputeStay] = useState<any | null>(null);
  const [disputeType, setDisputeType] = useState("");
  const [disputeDetails, setDisputeDetails] = useState("");
  const [disputeLoading, setDisputeLoading] = useState(false);
  const [disputeSuccess, setDisputeSuccess] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!userId) return;
      setIsLoading(true);
      try {
        const fetchedBookings = await getMemberBookings();
        const fetchedSaved = await getSavedLodges();
        const fetchedViewings = await getMemberViewings();
        
        const mappedBookings = fetchedBookings.map(b => ({
          id: b.id,
          displayId: b.id.substring(0, 8).toUpperCase(),
          propertyId: b.propertyId,
          property: b.property.title,
          location: b.property.location,
          date: new Date(b.date).toLocaleDateString(),
          status: new Date(b.date) > new Date() ? "upcoming" : "past",
          image: b.property.images[0] || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=400",
          amount: `₦${b.amount.toLocaleString()}`,
          rating: b.status === "COMPLETED" ? 5 : null,
        }));

        const mappedSaved = fetchedSaved.map(p => ({
          id: p.id,
          propertyId: p.id,
          property: p.title,
          location: p.location,
          date: "Saved",
          status: "saved",
          image: p.images[0] || "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=400",
          amount: `₦${p.price.toLocaleString()}`,
        }));

        setBookings(mappedBookings);
        setSavedLodges(mappedSaved);
        setViewings(fetchedViewings);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [userId]);

  const allItems = [...bookings, ...savedLodges];
  const filteredStays = allItems.filter(stay => stay.status === activeTab);

  const handleCancelViewing = async (id: string) => {
    if (!confirm("Cancel this viewing request?")) return;
    try {
      await cancelViewing(id);
      setViewings(v => v.filter(x => x.id !== id));
    } catch {
      alert("Failed to cancel viewing.");
    }
  };

  const handleReportDispute = async () => {
    if (!disputeType || !disputeStay) return;
    setDisputeLoading(true);
    
    try {
      await createDispute(disputeStay.id, disputeType, disputeDetails || "No additional details provided");
      setDisputeSuccess(true);
      setTimeout(() => {
        setDisputeStay(null);
        setDisputeType("");
        setDisputeDetails("");
        setDisputeSuccess(false);
      }, 2500);
    } catch (err) {
      alert("Failed to submit dispute");
    } finally {
      setDisputeLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Stays</h1>
          <p className="text-muted-foreground mt-1">Manage your bookings and view your past trips.</p>
        </div>

        {/* Dispute Modal */}
        {disputeStay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-border">
              {disputeSuccess ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-14 h-14 text-[#008A4B] mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-foreground">Dispute Submitted!</h3>
                  <p className="text-muted-foreground text-sm mt-2">Our admin team will review your case and reach out shortly.</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Flag className="w-5 h-5 text-red-500" /> Report a Dispute
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">{disputeStay.property}</p>
                    </div>
                    <button onClick={() => setDisputeStay(null)} className="text-muted-foreground hover:text-foreground transition">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-foreground">Issue Type</label>
                    <select
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-secondary focus:ring-2 focus:ring-[#008A4B]/30 outline-none"
                      onChange={e => setDisputeType(e.target.value)}
                      value={disputeType}
                    >
                      <option value="">Select an issue...</option>
                      <option value="False Advertising">False Advertising</option>
                      <option value="Facility Mismatch">Facility Mismatch (photos don't match reality)</option>
                      <option value="Host Unreachable">Agent/Host Unreachable</option>
                      <option value="Refund Request">Refund Request</option>
                      <option value="Safety Concern">Safety Concern</option>
                      <option value="Other">Other</option>
                    </select>
                    <label className="text-sm font-semibold text-foreground block mt-3">Additional Details</label>
                    <textarea
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-secondary focus:ring-2 focus:ring-[#008A4B]/30 outline-none resize-none"
                      rows={4}
                      placeholder="Describe the issue in detail..."
                      value={disputeDetails}
                      onChange={e => setDisputeDetails(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-3 mt-5">
                    <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setDisputeStay(null)}>Cancel</Button>
                    <Button
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl"
                      disabled={!disputeType || disputeLoading}
                      onClick={handleReportDispute}
                    >
                      {disputeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Dispute"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-border overflow-x-auto whitespace-nowrap scrollbar-hide">
          <button 
            className={`pb-4 px-6 font-medium text-sm transition-colors border-b-2 ${activeTab === 'upcoming' ? 'border-[#008A4B] text-[#008A4B]' : 'border-transparent text-muted-foreground hover:text-slate-700'}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming Stays
          </button>
          <button 
            className={`pb-4 px-6 font-medium text-sm transition-colors border-b-2 ${activeTab === 'past' ? 'border-[#008A4B] text-[#008A4B]' : 'border-transparent text-muted-foreground hover:text-slate-700'}`}
            onClick={() => setActiveTab('past')}
          >
            Past Stays
          </button>
          <button 
            className={`pb-4 px-6 font-medium text-sm transition-colors border-b-2 ${activeTab === 'saved' ? 'border-[#008A4B] text-[#008A4B]' : 'border-transparent text-muted-foreground hover:text-slate-700'}`}
            onClick={() => setActiveTab('saved')}
          >
            Saved Lodges
          </button>
          <button 
            className={`pb-4 px-6 font-medium text-sm transition-colors border-b-2 ${activeTab === 'viewings' ? 'border-[#008A4B] text-[#008A4B]' : 'border-transparent text-muted-foreground hover:text-slate-700'}`}
            onClick={() => setActiveTab('viewings')}
          >
            My Viewings
          </button>
        </div>

        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-border shadow-sm text-muted-foreground">
              Loading...
            </div>
          ) : activeTab === 'viewings' ? (
            viewings.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-2xl border border-border shadow-sm">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-foreground">No viewings scheduled</h3>
                <p className="text-muted-foreground mt-1">Visit a listing to schedule a physical inspection.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {viewings.map((v) => (
                  <div key={v.id} className="bg-card rounded-2xl border border-border shadow-sm p-5 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div>
                      <p className="font-bold text-foreground text-lg">{v.property.title}</p>
                      <p className="text-muted-foreground text-sm mt-0.5">{v.property.location}, {v.property.state}</p>
                      <div className="flex gap-4 mt-2 text-sm font-medium text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4 text-[#008A4B]" />{new Date(v.date).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-[#008A4B]" />{v.time}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        v.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' :
                        v.status === 'PENDING'   ? 'bg-amber-100 text-amber-700' :
                        v.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>{v.status}</span>
                      {(v.status === 'PENDING' || v.status === 'CONFIRMED') && (
                        <Button variant="outline" size="sm" onClick={() => handleCancelViewing(v.id)} className="text-red-600 border-red-200 hover:bg-red-50 rounded-lg">
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : filteredStays.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-border shadow-sm">
               <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
               <h3 className="text-lg font-bold text-foreground">No {activeTab} stays found</h3>
               <p className="text-muted-foreground mt-1">When you book or save a lodge, it will appear here.</p>
               <Button className="mt-6 bg-[#008A4B] hover:bg-[#006F3C] text-white rounded-xl" asChild>
                 <Link href="/member">Explore Lodges</Link>
               </Button>
            </div>
          ) : (
            filteredStays.map((stay) => (
              <div key={stay.id} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col md:flex-row group hover:shadow-md transition">
                <div className="w-full md:w-64 h-48 md:h-auto relative">
                  <Image src={stay.image} alt={stay.property} width={300} height={200} className="w-full h-full object-cover" />
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{stay.id}</p>
                        <h3 className="text-xl font-bold text-foreground">{stay.property}</h3>
                      </div>
                      <p className="font-bold text-foreground">{stay.amount}</p>
                    </div>
                    <p className="text-muted-foreground text-sm flex items-center gap-1 mb-2">
                      <MapPin className="w-4 h-4" /> {stay.location}
                    </p>
                    <p className="text-muted-foreground font-medium flex items-center gap-1 mb-4">
                      <Calendar className="w-4 h-4 text-[#008A4B]" /> {stay.date}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3 border-t border-border pt-4 flex-wrap">
                    {stay.status === 'upcoming' ? (
                      <>
                        <Button className="bg-[#008A4B] hover:bg-[#006F3C] text-white flex-1 md:flex-none rounded-xl" asChild>
                          <Link href={`/member/listing/${stay.propertyId}`}>View Details</Link>
                        </Button>
                        <Button variant="outline" className="flex-1 md:flex-none rounded-xl">Contact Agent</Button>
                        <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-1 text-xs" onClick={() => setDisputeStay(stay)}>
                          <Flag className="w-3.5 h-3.5" /> Report Issue
                        </Button>
                      </>
                    ) : stay.status === 'saved' ? (
                      <>
                        <Button className="bg-[#008A4B] hover:bg-[#006F3C] text-white flex-1 md:flex-none rounded-xl" asChild>
                          <Link href={`/member/listing/${stay.propertyId}`}>View Details</Link>
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="outline" className="flex-1 md:flex-none rounded-xl">Book Again</Button>
                        {stay.rating ? (
                          <div className="flex items-center gap-1 text-amber-400 px-4">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="font-bold text-foreground text-sm">You rated {stay.rating}.0</span>
                          </div>
                        ) : (
                          <Button variant="ghost" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50">Leave a Review</Button>
                        )}
                        <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-1 text-xs ml-auto" onClick={() => setDisputeStay(stay)}>
                          <Flag className="w-3.5 h-3.5" /> Report Issue
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </PageTransition>
  );
}
