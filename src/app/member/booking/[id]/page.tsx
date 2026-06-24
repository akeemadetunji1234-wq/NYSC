"use client";

import { PageTransition } from "../../../../components/layout/PageTransition";
import { CheckCircle2, MapPin, Calendar, CreditCard, ShieldCheck, ChevronLeft, Building } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { getPropertyById } from "../../../actions/property";
import { createBooking } from "../../../actions/member";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

export default function BookingConfirmationPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id || "1";
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  const [step, setStep] = useState<1 | 2>(1);
  const [property, setProperty] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingRef, setBookingRef] = useState("");

  useEffect(() => {
    async function loadProperty() {
      if (!id) return;
      const data = await getPropertyById(id);
      if (data) setProperty(data);
    }
    loadProperty();
  }, [id]);

  const handlePayment = async () => {
    if (!property) return;
    setIsProcessing(true);
    try {
      const total = property.price * 1.05;
      const booking = await createBooking(property.id, total, userId);
      setBookingRef("BKG-" + booking.id.substring(0, 8).toUpperCase());
      setStep(2);
    } catch (error) {
      toast.error("Failed to process payment. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!property) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-slate-500">Loading booking details...</p>
      </div>
    );
  }

  const basePrice = property.price;
  const platformFee = basePrice * 0.05;
  const total = basePrice + platformFee;

  // Mock lodge data fallback
  const lodge = {
    name: property.title,
    location: `${property.location}, ${property.state}`,
    price: `₦${basePrice.toLocaleString()}`,
    image: property.images?.[0] || "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=400"
  };

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto p-4 md:p-8 pb-32">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/member/listing/${id}`} className="text-slate-500 hover:text-slate-900 flex items-center gap-2 font-medium mb-6">
            <ChevronLeft className="w-5 h-5" /> Back to listing
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">
            {step === 1 ? "Review and Pay" : "Booking Confirmed"}
          </h1>
        </div>

        {step === 1 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-8">
               {/* Stay Details */}
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-900 mb-4">Your trip</h2>
                  
                  <div className="flex items-start justify-between mb-4 pb-4 border-b border-slate-100">
                    <div className="flex gap-4">
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <Calendar className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">Move-in Date</p>
                        <p className="text-sm text-slate-500">Nov 1, 2026</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="underline font-bold text-slate-900">Edit</Button>
                  </div>

                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <Building className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">Duration</p>
                        <p className="text-sm text-slate-500">1 Year (Standard)</p>
                      </div>
                    </div>
                  </div>
               </div>

               {/* Payment Method */}
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-900 mb-4">Pay with</h2>
                  
                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-4 border border-green-500 bg-green-50 rounded-xl cursor-pointer">
                      <div className="flex items-center gap-3">
                        <input type="radio" name="payment" defaultChecked className="w-4 h-4 text-green-600 focus:ring-green-500" />
                        <CreditCard className="w-5 h-5 text-green-700" />
                        <span className="font-medium text-green-900">Credit / Debit Card</span>
                      </div>
                    </label>
                    <label className="flex items-center justify-between p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <input type="radio" name="payment" className="w-4 h-4 text-green-600 focus:ring-green-500" />
                        <span className="font-bold text-slate-600">Bank Transfer</span>
                      </div>
                    </label>
                  </div>
               </div>

               <Button 
                 onClick={handlePayment} 
                 disabled={isProcessing}
                 className="w-full bg-[#008A4B] hover:bg-[#006F3C] text-white py-6 rounded-xl font-bold text-lg"
               >
                 {isProcessing ? "Processing Secure Payment..." : `Confirm and Pay ₦${total.toLocaleString()}`}
               </Button>
            </div>

            {/* Order Summary Sidebar */}
            <div className="md:col-span-1">
               <div className="sticky top-24 bg-white p-6 rounded-3xl border border-slate-200 shadow-xl">
                 <div className="flex gap-4 pb-6 border-b border-slate-100">
                   <Image src={lodge.image} alt={lodge.name} width={96} height={96} className="w-24 h-24 object-cover rounded-xl" />
                   <div>
                     <p className="font-bold text-slate-900 line-clamp-1">{lodge.name}</p>
                     <p className="text-xs text-slate-500 mb-2">{lodge.location}</p>
                     <div className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-full w-max">
                       <ShieldCheck className="w-3 h-3 text-[#008A4B]" /> Escrow Protected
                     </div>
                   </div>
                 </div>

                 <div className="py-6 border-b border-slate-100 space-y-4">
                   <h3 className="font-bold text-slate-900 text-lg">Price details</h3>
                   <div className="flex justify-between items-center text-slate-600">
                     <span>Base rent</span>
                     <span>{lodge.price}</span>
                   </div>
                   <div className="flex justify-between items-center text-slate-600">
                     <span className="underline decoration-slate-300">Platform fee (5%)</span>
                     <span>₦{platformFee.toLocaleString()}</span>
                   </div>
                 </div>

                 <div className="pt-6">
                   <div className="flex justify-between items-center font-bold text-slate-900 text-xl">
                     <span>Total (NGN)</span>
                     <span>₦{total.toLocaleString()}</span>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 md:p-12 text-center border border-slate-200 shadow-xl max-w-2xl mx-auto">
             <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
             </div>
             <h2 className="text-3xl font-bold text-slate-900 mb-4">Payment Successful!</h2>
             <p className="text-slate-500 text-lg mb-8 max-w-md mx-auto">
               Your payment is held securely in escrow. The agent has been notified and you can move in on Nov 1, 2026.
             </p>
             
             <div className="bg-slate-50 p-6 rounded-2xl mb-8 text-left border border-slate-100">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Booking Reference</p>
                <p className="text-2xl font-mono font-bold text-slate-900 mb-6">{bookingRef}</p>
                
                <div className="flex items-center gap-4 border-t border-slate-200 pt-4">
                  <Image src={lodge.image} alt={lodge.name} width={48} height={48} className="w-12 h-12 rounded-lg object-cover" />
                  <div>
                    <p className="font-bold text-slate-900">{lodge.name}</p>
                    <p className="text-xs text-slate-500">Starts Nov 1, 2026</p>
                  </div>
                </div>
             </div>

             <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="bg-[#008A4B] hover:bg-[#006F3C] text-white py-6 px-8 rounded-xl font-bold" asChild>
                   <Link href="/member/history">View My Stays</Link>
                </Button>
                <Button variant="outline" className="py-6 px-8 rounded-xl font-bold text-slate-700" asChild>
                   <Link href="/member">Explore More</Link>
                </Button>
             </div>
          </div>
        )}

      </div>
    </PageTransition>
  );
}
