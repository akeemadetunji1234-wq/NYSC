"use client";

import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Calendar, Clock, X } from "lucide-react";
import { scheduleViewing } from "../../app/actions/viewing";
import { useSession } from "next-auth/react";

export function ScheduleViewingModal({ propertyId }: { propertyId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) {
      alert("Please log in to schedule a viewing.");
      return;
    }
    
    setLoading(true);
    try {
      const corpMemberId = (session.user as any).id;
      await scheduleViewing(propertyId, corpMemberId, new Date(date), time);
      alert("Viewing scheduled successfully! The agent will review your request.");
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      alert("Failed to schedule viewing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        onClick={() => setIsOpen(true)}
        className="w-full py-6 rounded-xl font-bold text-lg mb-4 text-[#008A4B] border-[#008A4B] hover:bg-[#008A4B]/10"
      >
        <Calendar className="w-5 h-5 mr-2" /> Schedule a Viewing
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-secondary rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">Schedule Viewing</h2>
              <p className="text-muted-foreground text-sm mt-1">Pick a date and time to visit the property.</p>
            </div>
            
            <form onSubmit={handleSchedule} className="p-6 space-y-4 bg-secondary">
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground">Preferred Date</label>
                <div className="relative">
                  <Calendar className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="date" 
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-[#008A4B]/20 focus:border-[#008A4B] transition bg-card"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground">Preferred Time</label>
                <div className="relative">
                  <Clock className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="time" 
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-[#008A4B]/20 focus:border-[#008A4B] transition bg-card"
                  />
                </div>
              </div>
              
              <div className="pt-4">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-[#008A4B] hover:bg-[#006F3C] text-white py-6 rounded-xl font-bold text-lg"
                >
                  {loading ? "Scheduling..." : "Confirm Schedule"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
