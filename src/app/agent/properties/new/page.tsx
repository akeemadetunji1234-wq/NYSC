"use client";

import { useState, useEffect, useCallback } from "react";
import { PageTransition } from "../../../../components/layout/PageTransition";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { createProperty } from "../../../actions/property";
import { getAgentProfile } from "../../../actions/agent";
import { 
  CheckCircle, Camera, BookOpen, MapPin, Shield, Zap, 
  Droplets, Car, Sofa, Waves, Trash2, ChevronLeft, 
  AlertCircle, ChevronRight, Check, Sparkles, Building, Lock
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "motion/react";

const MapPicker = dynamic(() => import("../../../../components/MapPicker"), { ssr: false });
import { NIGERIA_STATES_AND_LGAS } from "../../../../lib/nigeriaStatesData";

export default function NewPropertyPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: "", 
    description: "", 
    state: "", 
    lga: "", 
    location: "",
    rent: "", 
    bedrooms: "1", 
    bathrooms: "1", 
    amenities: [] as string[],
    imageUrls: [] as string[],
  });
  
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const handleMapPositionChange = useCallback((pos: { lat: number; lng: number }) => {
    setCoordinates(pos);
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isVerified, setIsVerified] = useState(true); // Default true to avoid flash
  const [isChecking, setIsChecking] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    async function checkVerification() {
      if (session === undefined) return;
      if (!userId) {
        setIsChecking(false);
        return;
      }
      try {
        const profile = await getAgentProfile(userId);
        if (profile) {
          setIsVerified(profile.agentVerified);
        } else {
          setIsVerified(false);
        }
      } catch (e) {
        setIsVerified(false);
      } finally {
        setIsChecking(false);
      }
    }
    checkVerification();
  }, [userId, session]);

  const amenityOptions = [
    { id: "electricity", label: "Stable Electricity", icon: Zap },
    { id: "water", label: "Running Water", icon: Droplets },
    { id: "security", label: "24/7 Security", icon: Shield },
    { id: "furnished", label: "Fully Furnished", icon: Sofa },
    { id: "parking", label: "Ample Parking", icon: Car },
    { id: "pool", label: "Swimming Pool", icon: Waves },
    { id: "gated", label: "Gated Compound", icon: Lock },
    { id: "prepaid", label: "Prepaid Meter", icon: Zap },
    { id: "cabinet", label: "Kitchen Cabinets", icon: BookOpen },
    { id: "wardrobe", label: "Wardrobes Fitted", icon: Sofa },
    { id: "tiled", label: "Tiled Floor", icon: Building },
    { id: "ac", label: "Air Conditioning", icon: Sparkles }
  ];

  const toggleAmenity = (id: string) =>
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(id) ? f.amenities.filter(a => a !== id) : [...f.amenities, id],
    }));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (form.imageUrls.length + files.length > 5) {
      alert("You can only upload up to 5 images.");
      return;
    }

    setIsUploading(true);
    const newUrls: string[] = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data.url) {
          newUrls.push(data.url);
        } else {
          alert(`Failed to upload ${file.name}`);
        }
      } catch (error) {
        console.error(error);
        alert(`Error uploading ${file.name}`);
      }
    }

    setForm(f => ({ ...f, imageUrls: [...f.imageUrls, ...newUrls] }));
    setIsUploading(false);
  };

  const removeImage = (index: number) => {
    setForm(f => ({
      ...f,
      imageUrls: f.imageUrls.filter((_, i) => i !== index)
    }));
  };

  const validateStep = () => {
    setValidationError(null);
    if (step === 1) {
      if (!form.title.trim()) {
        setValidationError("Listing title is required.");
        return false;
      }
      if (form.title.length < 10) {
        setValidationError("Title should be at least 10 characters long.");
        return false;
      }
      if (!form.description.trim() || form.description.length < 30) {
        setValidationError("Please write a detailed description (min 30 characters).");
        return false;
      }
    }
    if (step === 2) {
      if (!form.state.trim() || !form.lga.trim() || !form.location.trim()) {
        setValidationError("All location fields are required.");
        return false;
      }
      if (!coordinates) {
        setValidationError("Please pin your property location on the map.");
        return false;
      }
    }
    if (step === 3) {
      const rentVal = parseInt(form.rent.replace(/[^\d]/g, ''), 10);
      if (!form.rent || isNaN(rentVal) || rentVal <= 0) {
        setValidationError("Please enter a valid annual rent fee.");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setValidationError(null);
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;
    setIsSubmitting(true);
    try {
      await createProperty({
        title: form.title,
        description: form.description,
        state: form.state,
        lga: form.lga,
        location: form.location || form.lga,
        price: parseInt(form.rent.replace(/[^\d]/g, ''), 10) || 0,
        bedrooms: parseInt(form.bedrooms, 10) || 1,
        bathrooms: parseInt(form.bathrooms, 10) || 1,
        amenities: form.amenities,
        images: form.imageUrls.length > 0 ? form.imageUrls : ["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600"],
        agentId: userId || "mock-agent-id",
        latitude: coordinates?.lat,
        longitude: coordinates?.lng,
      });

      router.push("/agent/properties");
    } catch (error: any) {
      console.error(error);
      const msg = error.message === "UNVERIFIED_AGENT" 
        ? "Your account must be verified by an admin before you can create properties."
        : "Failed to create property. Please try again.";
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-8">
        
        <div className="flex items-center gap-2 mb-4">
          <Link href="/agent/properties" className="text-muted-foreground hover:text-slate-900 flex items-center gap-1 font-semibold transition">
            <ChevronLeft className="w-4 h-4" /> Back to Properties
          </Link>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-foreground">Add New Property Listing</h1>
          <p className="text-muted-foreground mt-1">Fill out the step-by-step form to publish your property lodge.</p>
        </div>

        {/* Stepper Progress Bar */}
        <div className="flex items-center justify-between">
          {["Basics", "Location", "Pricing", "Amenities", "Photos"].map((label, idx) => {
            const stepNum = idx + 1;
            return (
              <div key={label} className="flex items-center flex-1 last:flex-none">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition ${
                  step > stepNum ? 'bg-blue-600 text-white border-blue-600' :
                  step === stepNum ? 'border-blue-600 text-blue-600 font-extrabold scale-105 shadow-sm' :
                  'border-gray-200 text-gray-400 bg-secondary'
                }`}>
                  {step > stepNum ? <Check className="w-4 h-4" /> : stepNum}
                </div>
                {stepNum < 5 && (
                  <div className={`h-0.5 flex-1 mx-2 ${step > stepNum ? 'bg-blue-600' : 'bg-gray-200'}`} />
                )}
              </div>
            );
          })}
        </div>

        {!isChecking && !isVerified && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex gap-4 items-start shadow-sm animate-in fade-in duration-300">
            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-800">Verification Required</h3>
              <p className="text-amber-700 text-sm mt-1">Your account must be fully verified by an administrator before you can publish listings. Please complete your KYC verification tab.</p>
            </div>
          </div>
        )}

        {validationError && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-xs font-semibold animate-in fade-in duration-200">
            {validationError}
          </div>
        )}

        <form onSubmit={handleSubmit} className={`space-y-6 ${(!isChecking && !isVerified) ? 'opacity-50 pointer-events-none' : ''}`}>
          
          <AnimatePresence mode="wait">
            {/* STEP 1: BASICS */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4"
              >
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-foreground">Property Basics</h3>
                </div>
                <p className="text-xs text-muted-foreground">General overview and details of the apartment.</p>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-semibold text-muted-foreground">Listing Title</label>
                      <span className="text-[10px] text-slate-400">{form.title.length}/60</span>
                    </div>
                    <input 
                      type="text" 
                      value={form.title} 
                      onChange={e => setForm({ ...form, title: e.target.value.slice(0, 60) })}
                      placeholder="e.g. Spacious 1 Bedroom Flat near Gboko Secretariat"
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 bg-card" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-1">Detailed Description</label>
                    <textarea 
                      rows={5} 
                      value={form.description} 
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      placeholder="Describe the proximity to the local Secretariat/PPA, amenities condition, rules, power supply..."
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 bg-card resize-none" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-muted-foreground mb-1">Bedrooms</label>
                      <input 
                        type="number" 
                        min={1} 
                        value={form.bedrooms} 
                        onChange={e => setForm({ ...form, bedrooms: e.target.value })}
                        className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 bg-card" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-muted-foreground mb-1">Bathrooms</label>
                      <input 
                        type="number" 
                        min={1} 
                        value={form.bathrooms} 
                        onChange={e => setForm({ ...form, bathrooms: e.target.value })}
                        className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 bg-card" 
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: LOCATION */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4"
              >
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-foreground">Location & Map</h3>
                </div>
                <p className="text-xs text-muted-foreground">Specify the exact coordinates to help estimate commute distance.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-1">State</label>
                    <select
                      value={form.state}
                      onChange={e => setForm({ ...form, state: e.target.value, lga: "" })}
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 bg-card cursor-pointer"
                    >
                      <option value="">Select State</option>
                      {Object.keys(NIGERIA_STATES_AND_LGAS).map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-1">LGA</label>
                    <select
                      value={form.lga}
                      onChange={e => setForm({ ...form, lga: e.target.value })}
                      disabled={!form.state}
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 bg-card cursor-pointer disabled:opacity-50"
                    >
                      <option value="">Select LGA</option>
                      {form.state && NIGERIA_STATES_AND_LGAS[form.state]?.map(lg => (
                        <option key={lg} value={lg}>{lg}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-muted-foreground mb-1">Full Location Address</label>
                    <input 
                      type="text" 
                      value={form.location} 
                      onChange={e => setForm({ ...form, location: e.target.value })}
                      placeholder="e.g. 8 Bolajoko Estate, Gboko"
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 bg-card" 
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-muted-foreground mb-2">
                      Pin Lodge on Map (Click to drop marker)
                    </label>
                    <MapPicker onPositionChange={handleMapPositionChange} />
                    {coordinates && (
                      <p className="text-xs text-blue-600 font-bold mt-2">
                        Pin coordinates registered: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: PRICING */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-foreground">Pricing Details</h3>
                </div>
                <p className="text-xs text-muted-foreground">Define annual rent pricing terms.</p>

                <div>
                  <label className="block text-sm font-semibold text-muted-foreground mb-1">Annual Rent (₦)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₦</span>
                    <input 
                      type="text" 
                      value={form.rent} 
                      onChange={e => setForm({ ...form, rent: e.target.value.replace(/[^\d,]/g, '') })}
                      placeholder="150,000"
                      className="w-full border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 bg-card font-bold" 
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: AMENITIES */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4"
              >
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-foreground">Property Amenities</h3>
                </div>
                <p className="text-xs text-muted-foreground">Select all available features in this lodge.</p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {amenityOptions.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleAmenity(id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        form.amenities.includes(id) 
                          ? "border-blue-600 bg-blue-50/50 text-blue-700" 
                          : "border-border hover:border-slate-300 text-muted-foreground bg-card"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="text-xs font-semibold">{label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 5: PHOTOS */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Camera className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-foreground">Property Photos</h3>
                </div>
                <p className="text-xs text-muted-foreground">Upload high-resolution images showing the rooms (max 5).</p>

                <div>
                  <label className="block text-sm font-semibold text-muted-foreground mb-1">Images ({form.imageUrls.length}/5)</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    onChange={handleImageUpload}
                    disabled={isUploading || form.imageUrls.length >= 5}
                    className="w-full border border-border rounded-xl px-4 py-2 text-sm focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer disabled:opacity-50" 
                  />
                  {isUploading && <p className="text-xs text-blue-600 mt-2 font-semibold">Uploading files...</p>}
                  
                  {form.imageUrls.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {form.imageUrls.map((url, i) => (
                        <div key={i} className="rounded-xl overflow-hidden h-28 w-full relative group shadow-sm border border-border">
                          <Image src={url} alt={`Preview ${i+1}`} fill className="object-cover" />
                          <button 
                            type="button" 
                            onClick={() => removeImage(i)} 
                            className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-lg text-white opacity-0 group-hover:opacity-100 transition hover:bg-red-500 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stepper Wizard Actions */}
          <div className="flex justify-between items-center gap-3 border-t border-border pt-4">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="flex items-center gap-1 text-slate-500 hover:text-slate-900 border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
              >
                Back
              </button>
            ) : (
              <div />
            )}
            
            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold cursor-pointer"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || !userId}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? "Publishing..." : "Save Property"}
              </button>
            )}
          </div>
        </form>
      </div>
    </PageTransition>
  );
}
