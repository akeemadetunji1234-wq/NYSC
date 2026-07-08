import { PageTransition } from "../../../../components/layout/PageTransition";
import { MapPin, Heart, Star, Share, ShieldCheck, Check, Building, Wifi, Car, BatteryCharging, ChevronLeft, Waves, Zap, Droplets, Phone, Mail, Navigation, Clock } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Listing ${id} | Neat & Affordable`,
    description: "Check out this amazing property for NYSC corp members on Neat & Affordable.",
    openGraph: {
      title: `Listing ${id} | Neat & Affordable`,
      description: "Check out this amazing property for NYSC corp members on Neat & Affordable.",
      url: `https://neat-affordable.ng/member/listing/${id}`,
    },
  };
}

import { getPropertyById } from "../../../actions/property";
import { notFound } from "next/navigation";
import { prisma } from "../../../../lib/prisma";
import { SavePropertyButton } from "../../../../features/member/SavePropertyButton";
import { ScheduleViewingModal } from "../../../../features/member/ScheduleViewingModal";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../api/auth/[...nextauth]/route";
import { calculateDistance, calculateTime } from "../../../../lib/distance";
import { getPropertyReviews, hasCompletedBooking } from "../../../actions/member";
import PropertyReviews from "../../../../features/member/PropertyReviews";
import { CommuteEstimator } from "../../../../components/shared/CommuteEstimator";
import { ContactAgentDropdown } from "../../../../components/shared/ContactAgentDropdown";

const amenityIconMap: Record<string, any> = {
  pool: Waves,
  security: ShieldCheck,
  electricity: Zap,
  water: Droplets,
  parking: Car,
  furnished: Building
};

const amenityLabelMap: Record<string, string> = {
  pool: "Swimming Pool",
  security: "24/7 Security",
  electricity: "Stable Electricity",
  water: "Running Water",
  parking: "Ample Parking",
  furnished: "Fully Furnished"
};

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return notFound();

  const property = await getPropertyById(id);

  // Fetch logged-in user's PPA for distance calculation
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  let ppaDistance: { km: number; mins: number; area: string } | null = null;
  let initialPpa = null;

  if (userId && property?.latitude && property?.longitude) {
    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      select: { ppaLatitude: true, ppaLongitude: true, ppaLga: true, ppaState: true },
    });
    initialPpa = userRecord;
    if (userRecord?.ppaLatitude && userRecord?.ppaLongitude) {
      const km = calculateDistance(
        userRecord.ppaLatitude,
        userRecord.ppaLongitude,
        property.latitude,
        property.longitude,
      );
      const mins = calculateTime(km);
      ppaDistance = { km, mins, area: `${userRecord.ppaLga}, ${userRecord.ppaState}` };
    }
  }

  const savedRecord = await prisma.savedProperty.findUnique({
    where: {
      userId_propertyId: {
        userId: userId || "mock-corp-id",
        propertyId: id,
      }
    }
  });
  const initiallySaved = !!savedRecord;

  // Fetch reviews and check if user can review sequentially to optimize connection footprint
  const propertyReviews = await getPropertyReviews(id);
  const canReview = userId ? await hasCompletedBooking(id, userId) : false;
  const hasAlreadyReviewed = userId 
    ? await prisma.review.findFirst({ where: { propertyId: id, corpMemberId: userId } }).then(r => !!r) 
    : false;

  const activeBooking = userId ? await prisma.booking.findFirst({
    where: { propertyId: id, corpMemberId: userId, status: { in: ["PENDING", "ACCEPTED"] } }
  }) : null;

  // Calculate real avg rating
  const realAvgRating = propertyReviews.length > 0
    ? propertyReviews.reduce((sum, r) => sum + r.rating, 0) / propertyReviews.length
    : null;


  if (!property) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Property not found</h2>
        <Link href="/member">
          <Button variant="outline">Back to Explore</Button>
        </Link>
      </div>
    );
  }

  const defaultImages = [
    "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1502672260266-1c1c2c49646b?auto=format&fit=crop&q=80&w=600",
  ];

  const displayImages = property.images && property.images.length >= 3 ? property.images : [...(property.images || []), ...defaultImages].slice(0, 3);

  const lodge = {
    id: property.id,
    name: property.title,
    location: `${property.location}, ${property.lga}, ${property.state}`,
    price: `₦${property.price.toLocaleString()}`,
    rating: realAvgRating ?? 4.8,
    reviews: propertyReviews.length,

    host: {
      id: property.agentId,
      name: property.agent?.name || "Agent",
      joined: new Date(property.createdAt).getFullYear().toString(),
      verified: property.agent?.agentVerified || false,
      image: property.agent?.image || "https://i.pravatar.cc/150?u=a042581f4e29026704d",
      phone: property.agent?.phone || "+234 800 000 0000",
      whatsapp: (property.agent as any)?.whatsapp || null,
    },
    images: displayImages,
    type: `${property.bedrooms} Bed, ${property.bathrooms} Bath`,
    description: property.description,
    amenities: property.amenities.map(a => ({
      icon: amenityIconMap[a] || Check,
      label: amenityLabelMap[a] || a
    })),
    rules: ["No loud music after 10PM", "No smoking indoors", "Pets are not allowed"],
    availability: "Available from next month",
    platformFee: property.price * 0.05,
    total: property.price * 1.05
  };

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 pb-32 lg:pb-8">
        
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <Link href="/member" className="text-muted-foreground hover:text-slate-900 flex items-center gap-2 font-medium">
            <ChevronLeft className="w-5 h-5" /> Back to explore
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-full shadow-sm"><Share className="w-4 h-4 mr-2" /> Share</Button>
            <SavePropertyButton propertyId={id} userId={userId || "mock-corp-id"} initiallySaved={initiallySaved} />
          </div>
        </div>

        {/* Title and Header Info */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">{lodge.name}</h1>
            {activeBooking && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wider">
                Booking ID: {activeBooking.id.substring(0, 8)}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-muted-foreground">
            <span className="flex items-center gap-1"><Star className="w-4 h-4 text-amber-400 fill-current" /> {lodge.rating} ({lodge.reviews} reviews)</span>
            <span>•</span>
            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {lodge.location}</span>
          </div>
          {/* PPA Distance Badge */}
          {ppaDistance ? (
            <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full">
              <Navigation className="w-4 h-4 text-[#008A4B]" />
              <span className="text-sm font-semibold text-[#008A4B]">
                {ppaDistance.km} km from your PPA
              </span>
              <span className="text-slate-300">|</span>
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground font-medium">
                ~{ppaDistance.mins} min drive
              </span>
              <span className="text-xs text-slate-400">(in {ppaDistance.area})</span>
            </div>
          ) : (
            !userId ? null : (
              <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-secondary border border-border rounded-full">
                <Navigation className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-muted-foreground">Set your PPA in profile to see distance</span>
              </div>
            )
          )}
        </div>


        {/* Image Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 rounded-3xl overflow-hidden h-[400px]">
          <div className="md:col-span-2 h-full relative">
            <Image src={lodge.images[0]} alt={lodge.name} width={800} height={600} className="w-full h-full object-cover hover:scale-105 transition duration-500 cursor-pointer" />
          </div>
          <div className="hidden md:grid grid-rows-2 gap-4 h-full">
            <div className="relative h-full">
              <Image src={lodge.images[1]} alt={`${lodge.name} interior`} width={400} height={300} className="w-full h-full object-cover hover:scale-105 transition duration-500 cursor-pointer" />
            </div>
            <div className="relative h-full">
              <Image src={lodge.images[2]} alt={`${lodge.name} exterior`} width={400} height={300} className="w-full h-full object-cover hover:scale-105 transition duration-500 cursor-pointer" />
            </div>
          </div>
          <div className="hidden md:grid grid-rows-2 gap-4 h-full">
            <div className="relative h-full">
              <Image src={lodge.images[0]} alt={`${lodge.name} room`} width={400} height={300} className="w-full h-full object-cover hover:scale-105 transition duration-500 cursor-pointer" />
            </div>
            <div className="relative group cursor-pointer overflow-hidden h-full">
               <Image src={lodge.images[1]} alt={`${lodge.name} facilities`} width={400} height={300} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
               <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                 <span className="text-white font-bold text-lg">View all photos</span>
               </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          <div className="lg:col-span-2 space-y-10">
            {/* Host Section */}
            <div className="border-b border-border pb-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-1">Hosted by {lodge.host.name}</h2>
                  <p className="text-sm text-muted-foreground">{lodge.type} • {lodge.host.joined}</p>
                </div>
                <div className="relative">
                  <Image src={lodge.host.image} alt={lodge.host.name} width={56} height={56} className="w-14 h-14 rounded-full border-2 border-white shadow-sm object-cover" />
                  {lodge.host.verified && (
                    <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-0.5 border border-white">
                      <ShieldCheck className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              </div>
              
              <ContactAgentDropdown host={lodge.host} />
              
              {/* PPA Commute & Cost Estimator Widget */}
              <CommuteEstimator 
                propertyLat={property.latitude}
                propertyLng={property.longitude}
                propertyState={property.state}
                userId={userId}
                initialPpa={initialPpa}
              />
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-bold text-foreground mb-4">About this lodge</h3>
              <p className="text-muted-foreground leading-relaxed">{lodge.description}</p>
            </div>

            {/* Amenities */}
            <div>
              <h3 className="text-lg font-bold text-foreground mb-4">What this place offers</h3>
              <div className="grid grid-cols-2 gap-4">
                {lodge.amenities.map((amenity, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-muted-foreground">
                    <amenity.icon className="w-5 h-5 text-[#008A4B]" /> {amenity.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Rules */}
            <div>
               <h3 className="text-lg font-bold text-foreground mb-4">House Rules</h3>
               <ul className="space-y-3">
                 {lodge.rules.map((rule, idx) => (
                   <li key={idx} className="flex items-start gap-3 text-muted-foreground">
                     <Check className="w-5 h-5 text-slate-400 shrink-0" /> {rule}
                   </li>
                 ))}
               </ul>
            </div>

            {/* Reviews Section */}
            <div>
              <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                Reviews & Trust Ratings
                {propertyReviews.length > 0 && (
                  <span className="text-sm font-normal text-muted-foreground ml-1">({propertyReviews.length})</span>
                )}
              </h3>
              <PropertyReviews
                propertyId={id}
                reviews={propertyReviews as any}
                userId={userId || null}
                canReview={canReview}
                hasAlreadyReviewed={hasAlreadyReviewed}
              />
            </div>
          </div>

          {/* Booking Widget (Sticky) */}
          <div className="hidden lg:block relative">
            <div className="sticky top-24 bg-card p-6 rounded-3xl shadow-xl border border-border">
               <div className="mb-6">
                 <p className="text-2xl font-bold text-[#008A4B]">{lodge.price}<span className="text-sm text-muted-foreground font-normal">/year</span></p>
               </div>
               
               <div className="space-y-4 mb-6">
                 <div className="p-4 bg-secondary border border-border rounded-2xl">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Availability</p>
                    <p className="font-medium text-foreground">{lodge.availability}</p>
                 </div>
                 <div className="p-4 bg-secondary border border-border rounded-2xl flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Move in from</p>
                      <p className="font-medium text-foreground">Nov 1, 2026</p>
                    </div>
                    <Building className="w-5 h-5 text-slate-400" />
                 </div>
               </div>

               <Button className="w-full bg-[#008A4B] hover:bg-[#006F3C] text-white py-6 rounded-xl font-bold text-lg mb-4" asChild>
                 <Link href={`/member/booking/${lodge.id}`}>
                    Request to Book
                 </Link>
               </Button>
               <ScheduleViewingModal propertyId={lodge.id} />
               <p className="text-center text-xs text-muted-foreground">No payments are processed on the app. Finalize payment directly with the agent.</p>
                
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex justify-between items-center font-bold text-foreground text-lg pt-2">
                     <span>Annual Rent</span>
                     <span>{lodge.price}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Bookings are requested on the app, payments are finalized outside the app directly with the agent.</p>
                </div>
            </div>
          </div>
        </div>

        {/* Mobile Fixed Booking Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 lg:hidden z-50 flex justify-between items-center px-4 md:px-8">
           <div>
             <p className="font-bold text-foreground">{lodge.price}<span className="text-xs text-muted-foreground font-normal">/yr</span></p>
             <p className="text-xs text-[#008A4B] font-medium">{lodge.availability}</p>
           </div>
           <div className="flex gap-2">
             <Button className="bg-[#008A4B] hover:bg-[#006F3C] text-white px-8 rounded-xl font-bold" asChild>
                <Link href={`/member/booking/${lodge.id}`}>
                   Book Now
                </Link>
             </Button>
           </div>
        </div>

      </div>
    </PageTransition>
  );
}
