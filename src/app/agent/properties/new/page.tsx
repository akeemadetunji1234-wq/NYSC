"use client";

import { useState, useEffect, useCallback } from "react";
import { PageTransition } from "../../../../components/layout/PageTransition";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { createProperty } from "../../../actions/property";
import { getAgentProfile } from "../../../actions/agent";
import { CheckCircle, Camera, BookOpen, MapPin, Shield, Zap, Droplets, Car, Sofa, Waves, Plus, Trash2, ChevronLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";

const MapPicker = dynamic(() => import("../../../../components/MapPicker"), { ssr: false });


export default function NewPropertyPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  const [form, setForm] = useState({
    title: "", description: "", state: "", lga: "", location: "",
    rent: "", bedrooms: "1", bathrooms: "1", amenities: [] as string[],
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

  useEffect(() => {
    async function checkVerification() {
      if (session === undefined) return; // Loading state
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
    { id: "pool", label: "Swimming Pool", icon: Waves },
    { id: "security", label: "24/7 Security Guard", icon: Shield },
    { id: "electricity", label: "Stable Electricity", icon: Zap },
    { id: "water", label: "Running Water", icon: Droplets },
    { id: "parking", label: "Ample Parking", icon: Car },
    { id: "furnished", label: "Fully Furnished", icon: Sofa },
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        images: form.imageUrls.length > 0 ? form.imageUrls : ["https://images.unsplash.com/photo-1705326701287-346fc37a2c86?w=800&h=600&fit=crop"],
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
          <Link href="/agent/properties" className="text-slate-500 hover:text-slate-900 flex items-center gap-1 font-medium transition">
            <ChevronLeft className="w-4 h-4" /> Back to Properties
          </Link>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add New Property</h1>
          <p className="text-slate-500 mt-1">Provide accurate details to help Corp members find your property.</p>
        </div>

        {!isChecking && !isVerified && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex gap-4 items-start shadow-sm">
            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-800">Verification Pending</h3>
              <p className="text-amber-700 text-sm mt-1">Your agent account is currently under review by our admin team. You cannot post new properties until you are fully verified.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className={`space-y-8 ${!isChecking && !isVerified ? 'opacity-50' : ''}`}>
          {/* Property Basics */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-900">Property Basics</h3>
            </div>
            <p className="text-xs text-slate-400 mb-5">General information about the apartment</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Listing Title</label>
                <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Spacious 2 Bedroom Flat near NYSC Camp"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Detailed Description</label>
                <textarea required rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the environment, proximity to key locations, and general condition of the apartment..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 resize-none" />
              </div>
            </div>
          </div>

          {/* Property Media */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Camera className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-900">Property Media</h3>
            </div>
            <p className="text-xs text-slate-400 mb-5">Upload up to 5 images for the property</p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Image Upload ({form.imageUrls.length}/5)</label>
              <input type="file" accept="image/*" multiple onChange={handleImageUpload}
                disabled={isUploading || form.imageUrls.length >= 5}
                className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              {isUploading && <p className="text-sm text-blue-600 mt-2">Uploading...</p>}
              
              {form.imageUrls.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {form.imageUrls.map((url, i) => (
                    <div key={i} className="rounded-xl overflow-hidden h-32 w-full relative group">
                      <Image src={url} alt={`Preview ${i+1}`} fill className="object-cover" />
                      <button type="button" onClick={() => removeImage(i)} className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-lg text-white opacity-0 group-hover:opacity-100 transition hover:bg-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Location & Specification */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-900">Location & Specification</h3>
            </div>
            <p className="text-xs text-slate-400 mb-5">Where is the property located and what is inside?</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                <input required value={form.state} onChange={e => setForm({ ...form, state: e.target.value })}
                  placeholder="e.g. Lagos"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">LGA / Neighbourhood</label>
                <input required value={form.lga} onChange={e => setForm({ ...form, lga: e.target.value })}
                  placeholder="e.g. Ikorodu"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Location/Address</label>
                <input required value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. 15 Awolowo Road, Ikoyi"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600" />
              </div>
              {/* Map Picker */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  Pin Property on Map
                  <span className="text-xs text-slate-400 font-normal ml-1">(click map to drop pin — helps Corpers see distance from their PPA)</span>
                </label>
                <MapPicker onPositionChange={handleMapPositionChange} />
                {coordinates && (
                  <p className="text-xs text-blue-600 mt-2 font-medium">
                    ✅ Pin set at: {coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Annual Rent (₦)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₦</span>
                  <input required type="text" value={form.rent} onChange={e => setForm({ ...form, rent: e.target.value })}
                    placeholder="450,000"
                    className="w-full border border-slate-200 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bedroom Count</label>
                <input required type="number" min={1} max={10} value={form.bedrooms} onChange={e => setForm({ ...form, bedrooms: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bathroom Count</label>
                <input required type="number" min={1} max={10} value={form.bathrooms} onChange={e => setForm({ ...form, bathrooms: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600" />
              </div>
            </div>
          </div>

          {/* Key Amenities */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-900">Key Amenities</h3>
            </div>
            <p className="text-xs text-slate-400 mb-5">Select all features available in the property</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {amenityOptions.map(({ id, label, icon: Icon }) => (
                <label key={id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  form.amenities.includes(id) ? "border-blue-600 bg-blue-50/50" : "border-slate-200 hover:border-slate-300"
                }`}>
                  <input type="checkbox" className="hidden" checked={form.amenities.includes(id)} onChange={() => toggleAmenity(id)} />
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                    form.amenities.includes(id) ? "bg-blue-600 border-blue-600" : "border-slate-300"
                  }`}>
                    {form.amenities.includes(id) && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <Icon className={`w-4 h-4 shrink-0 ${form.amenities.includes(id) ? "text-blue-600" : "text-slate-400"}`} />
                  <span className="text-sm text-slate-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end pt-2 pb-8">
            <div className="flex gap-3">
              <Link href="/agent/properties" className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition">
                Cancel
              </Link>
              <button disabled={isSubmitting || (!isChecking && !isVerified) || !userId} type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                {isSubmitting ? "Submitting..." : (!userId ? "Sign in to post" : "Save Property")}
              </button>
            </div>
          </div>
        </form>
      </div>
    </PageTransition>
  );
}
