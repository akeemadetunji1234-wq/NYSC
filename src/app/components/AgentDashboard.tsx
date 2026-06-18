"use client";
import React, { useState } from "react";
import {
  LayoutDashboard, Home, Calendar, DollarSign, Settings,
  Search, MoreVertical, Star, Building, TrendingUp, Users,
  LogOut, X, Plus, Phone, ChevronDown, CheckCircle,
  Camera, Bell, Shield, User, Edit3, Trash2, Eye,
  Clock, Filter, Download, AlertCircle, MapPin,
  Zap, Waves, Car, Sofa, Droplets, BookOpen, ChevronRight
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Listing = {
  id: number; apartment: string; location: string; price: string; rooms: string;
  state: string; status: "Published" | "Pending" | "Draft" | "Rejected"; 
  consultations: number; dateAdded: string; image: string;
};

type Booking = {
  id: number; memberName: string; memberEmail: string; memberAvatar: string;
  property: string; location: string; date: string; time: string;
  feeStatus: "Paid" | "Unpaid" | "Refunded"; requestStatus: "Pending" | "Accepted" | "Completed" | "Declined";
};

type NavPage = "dashboard" | "listings" | "bookings" | "create-listing" | "earnings" | "settings";

const LISTING_IMAGES = [
  "https://images.unsplash.com/photo-1705326701287-346fc37a2c86?w=200&h=120&fit=crop",
  "https://images.unsplash.com/photo-1646987916641-1f3c8992daa2?w=200&h=120&fit=crop",
  "https://images.unsplash.com/photo-1720247520862-7e4b14176fa8?w=200&h=120&fit=crop",
  "https://images.unsplash.com/photo-1667584523543-d1d9cc828a15?w=200&h=120&fit=crop",
  "https://images.unsplash.com/photo-1708113388262-17fdf0e21205?w=200&h=120&fit=crop",
];

// ─── Create Listing Form ──────────────────────────────────────────────────────
function CreateListingPage({ onBack }: { onBack: () => void }) {
  const [form, setForm] = useState({
    title: "", description: "", state: "", lga: "",
    rent: "", bedrooms: "1", amenities: [] as string[],
  });
  const [submitted, setSubmitted] = useState(false);

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

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-10 h-10 text-[#008A4B]" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Listing Submitted!</h2>
        <p className="text-gray-500 mb-1">Your listing has been sent for admin moderation.</p>
        <p className="text-sm text-gray-400 mb-8">It will be reviewed within 24 hours before going live.</p>
        <button onClick={onBack} className="bg-[#008A4B] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#006F3C] transition">
          Back to Listings
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
        <span>Property Management</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#008A4B] font-medium">ID: NYSC-LST-{Math.floor(Math.random() * 9000 + 1000)}</span>
      </div>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Create New Listing</h2>
          <p className="text-gray-500 text-sm mt-1">Provide accurate details to help Corp members find your property.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onBack} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">
            Discard
          </button>
          <button className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 font-medium hover:bg-gray-50 transition">
            Save as Draft
          </button>
        </div>
      </div>

      <form onSubmit={e => { e.preventDefault(); setSubmitted(true); }} className="space-y-8">
        {/* Property Basics */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-[#008A4B]" />
            <h3 className="font-bold text-gray-900">Property Basics</h3>
          </div>
          <p className="text-xs text-gray-400 mb-5">General information about the apartment</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Listing Title</label>
              <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Spacious 2 Bedroom Flat near NYSC Camp"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#008A4B]/20 focus:border-[#008A4B]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Description</label>
              <textarea required rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the environment, proximity to key locations, and general condition of the apartment..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#008A4B]/20 focus:border-[#008A4B] resize-none" />
            </div>
          </div>
        </div>

        {/* Location & Specification */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-[#008A4B]" />
            <h3 className="font-bold text-gray-900">Location & Specification</h3>
          </div>
          <p className="text-xs text-gray-400 mb-5">Where is the property located and what is inside?</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input required value={form.state} onChange={e => setForm({ ...form, state: e.target.value })}
                placeholder="e.g. Lagos"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#008A4B]/20 focus:border-[#008A4B]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LGA / Neighbourhood</label>
              <input required value={form.lga} onChange={e => setForm({ ...form, lga: e.target.value })}
                placeholder="e.g. Ikorodu"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#008A4B]/20 focus:border-[#008A4B]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Annual Rent (₦)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₦</span>
                <input required type="number" value={form.rent} onChange={e => setForm({ ...form, rent: e.target.value })}
                  placeholder="450,000"
                  className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#008A4B]/20 focus:border-[#008A4B]" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bedroom Count</label>
              <input required type="number" min={1} max={10} value={form.bedrooms} onChange={e => setForm({ ...form, bedrooms: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#008A4B]/20 focus:border-[#008A4B]" />
            </div>
          </div>
        </div>

        {/* Key Amenities */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-[#008A4B]" />
            <h3 className="font-bold text-gray-900">Key Amenities</h3>
          </div>
          <p className="text-xs text-gray-400 mb-5">Select all features available in the property</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {amenityOptions.map(({ id, label, icon: Icon }) => (
              <label key={id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                form.amenities.includes(id) ? "border-[#008A4B] bg-[#008A4B]/5" : "border-gray-200 hover:border-gray-300"
              }`}>
                <input type="checkbox" className="hidden" checked={form.amenities.includes(id)} onChange={() => toggleAmenity(id)} />
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                  form.amenities.includes(id) ? "bg-[#008A4B] border-[#008A4B]" : "border-gray-300"
                }`}>
                  {form.amenities.includes(id) && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
                <Icon className={`w-4 h-4 shrink-0 ${form.amenities.includes(id) ? "text-[#008A4B]" : "text-gray-400"}`} />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Property Media */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-1">
            <Camera className="w-4 h-4 text-[#008A4B]" />
            <h3 className="font-bold text-gray-900">Property Media</h3>
          </div>
          <p className="text-xs text-gray-400 mb-5">Upload high-quality images of the interior and exterior</p>

          <div className="flex gap-3 flex-wrap">
            {[
              "https://images.unsplash.com/photo-1705326701287-346fc37a2c86?w=120&h=90&fit=crop",
              "https://images.unsplash.com/photo-1646987916641-1f3c8992daa2?w=120&h=90&fit=crop",
            ].map((src, i) => (
              <div key={i} className="w-28 h-20 rounded-xl overflow-hidden relative group">
                <img src={src} alt="property" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-white" />
                </div>
              </div>
            ))}
            <div className="w-28 h-20 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-[#008A4B]/50 transition">
              <Plus className="w-5 h-5 text-gray-400" />
              <span className="text-xs text-gray-400">Add Photo</span>
            </div>
          </div>

          <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> Upload Guidelines
            </p>
            <ul className="text-xs text-blue-600 space-y-1">
              <li>• Minimum 3 photos required for verification.</li>
              <li>• Include at least one shot of the bedroom and bathroom.</li>
              <li>• Maximum file size per image is 5MB.</li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 pb-8">
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-green-500" /> Listing will be submitted for admin moderation.
          </p>
          <div className="flex gap-3">
            <button type="button" onClick={onBack} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">
              Cancel
            </button>
            <button type="submit" className="px-6 py-2.5 bg-[#008A4B] text-white rounded-xl text-sm font-semibold hover:bg-[#006F3C] transition shadow-md">
              Submit for Verification
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ─── Bookings & Consultations Page ───────────────────────────────────────────
function BookingsPage() {
  const [activeFilter, setActiveFilter] = useState<"all" | "pending" | "confirmed" | "history">("all");
  const [search, setSearch] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([
    { id: 1, memberName: "Tunde Adenekan", memberEmail: "tunde.a@nysc.gov.ng", memberAvatar: "TA", property: "Cozy 1BR Apartment - Lekki Phase 1", location: "Lagos, Nigeria", date: "Oct 24, 2024", time: "10:00 AM", feeStatus: "Paid", requestStatus: "Pending" },
    { id: 2, memberName: "Chioma Okereke", memberEmail: "chioma.o@corp.ng", memberAvatar: "CO", property: "Modern Studio - Wuse II, Abuja", location: "Lagos, Nigeria", date: "Oct 24, 2024", time: "02:30 PM", feeStatus: "Paid", requestStatus: "Accepted" },
    { id: 3, memberName: "Ibrahim Musa", memberEmail: "ibrahim.m@nysc.gov.ng", memberAvatar: "IM", property: "3BR Shared Flat - Ikeja GRA", location: "Lagos, Nigeria", date: "Oct 25, 2024", time: "09:00 AM", feeStatus: "Unpaid", requestStatus: "Pending" },
    { id: 4, memberName: "Sarah Edem", memberEmail: "sarah.e@corp.ng", memberAvatar: "SE", property: "Self-Contained - Minna Central", location: "Lagos, Nigeria", date: "Oct 26, 2024", time: "11:00 AM", feeStatus: "Paid", requestStatus: "Completed" },
    { id: 5, memberName: "Olawale Bakare", memberEmail: "olawale.b@nysc.gov.ng", memberAvatar: "OB", property: "2BR Serviced Apartment - Port Harcourt", location: "Lagos, Nigeria", date: "Oct 26, 2024", time: "04:00 PM", feeStatus: "Refunded", requestStatus: "Declined" },
  ]);

  const updateStatus = (id: number, status: Booking["requestStatus"]) =>
    setBookings(prev => prev.map(b => b.id === id ? { ...b, requestStatus: status } : b));

  const filtered = bookings.filter(b => {
    const matchSearch = search === "" || b.memberName.toLowerCase().includes(search.toLowerCase()) || b.property.toLowerCase().includes(search.toLowerCase());
    const matchFilter = activeFilter === "all" ||
      (activeFilter === "pending" && b.requestStatus === "Pending") ||
      (activeFilter === "confirmed" && b.requestStatus === "Accepted") ||
      (activeFilter === "history" && (b.requestStatus === "Completed" || b.requestStatus === "Declined"));
    return matchSearch && matchFilter;
  });

  const statusColors: Record<Booking["requestStatus"], string> = {
    Pending: "bg-yellow-50 text-yellow-700 border-yellow-100",
    Accepted: "bg-blue-50 text-blue-700 border-blue-100",
    Completed: "bg-green-50 text-green-700 border-green-100",
    Declined: "bg-red-50 text-red-700 border-red-100",
  };

  const feeColors: Record<Booking["feeStatus"], string> = {
    Paid: "text-green-600",
    Unpaid: "text-red-500",
    Refunded: "text-gray-500",
  };

  return (
    <div>
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bookings & Consultations</h2>
          <p className="text-gray-500 text-sm mt-1">Manage incoming visit requests and confirmed physical tours.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition">
            <Filter className="w-4 h-4" /> Filters
          </button>
          <button className="flex items-center gap-2 bg-[#008A4B] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#006F3C] transition shadow-sm">
            <Plus className="w-4 h-4" /> New Manual Booking
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {[
          { label: "Pending Requests", value: bookings.filter(b => b.requestStatus === "Pending").length.toString(), icon: Clock, iconBg: "bg-yellow-50 text-yellow-600" },
          { label: "Confirmed Today", value: bookings.filter(b => b.requestStatus === "Accepted").length.toString(), icon: CheckCircle, iconBg: "bg-green-50 text-green-600" },
          { label: "Avg. Response Time", value: "1.2 hrs", icon: TrendingUp, iconBg: "bg-blue-50 text-blue-600" },
          { label: "Conversion Rate", value: "68%", icon: Users, iconBg: "bg-purple-50 text-purple-600" },
        ].map(({ label, value, icon: Icon, iconBg }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">{label}</p>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconBg}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {(["all", "pending", "confirmed", "history"] as const).map(f => (
              <button key={f} onClick={() => setActiveFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${activeFilter === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                {f === "all" ? "All Requests" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by member or property..."
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#008A4B]/20 focus:border-[#008A4B] w-72 bg-gray-50" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/70 text-gray-400 text-xs uppercase tracking-wide border-b border-gray-100">
                <th className="font-medium py-3.5 px-6">Corp Member</th>
                <th className="font-medium py-3.5 px-6">Property Interest</th>
                <th className="font-medium py-3.5 px-6">Proposed Schedule</th>
                <th className="font-medium py-3.5 px-6">Fee Status</th>
                <th className="font-medium py-3.5 px-6">Request Status</th>
                <th className="font-medium py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400 text-sm">No bookings found</td></tr>
              ) : filtered.map(b => (
                <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#008A4B]/15 flex items-center justify-center text-[#008A4B] text-xs font-bold shrink-0">
                        {b.memberAvatar}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{b.memberName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{b.memberEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-start gap-2">
                      <Building className="w-3.5 h-3.5 text-[#008A4B] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{b.property}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />{b.location}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-sm text-gray-800 font-medium">{b.date}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{b.time}</p>
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <p className={`text-sm font-semibold ${feeColors[b.feeStatus]}`}>{b.feeStatus}</p>
                      <p className="text-xs text-gray-400 mt-0.5">₦5,000</p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColors[b.requestStatus]}`}>
                      {b.requestStatus}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end gap-2">
                      {b.requestStatus === "Pending" && (
                        <>
                          <button onClick={() => updateStatus(b.id, "Accepted")}
                            className="px-3 py-1.5 bg-[#008A4B] text-white rounded-lg text-xs font-semibold hover:bg-[#006F3C] transition">
                            Accept
                          </button>
                          <button onClick={() => updateStatus(b.id, "Declined")}
                            className="px-3 py-1.5 border border-red-200 text-red-500 rounded-lg text-xs font-semibold hover:bg-red-50 transition">
                            Decline
                          </button>
                        </>
                      )}
                      {b.requestStatus === "Accepted" && (
                        <>
                          <a href={`tel:${b.memberEmail}`} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition flex items-center gap-1">
                            <Phone className="w-3 h-3" /> Call
                          </a>
                          <button onClick={() => updateStatus(b.id, "Completed")}
                            className="px-3 py-1.5 bg-[#008A4B]/10 text-[#008A4B] rounded-lg text-xs font-semibold hover:bg-[#008A4B]/20 transition">
                            Mark Done
                          </button>
                        </>
                      )}
                      {(b.requestStatus === "Completed" || b.requestStatus === "Declined") && (
                        <span className="text-xs text-gray-400 italic">Closed</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-400">Showing {filtered.length} of {bookings.length} booking requests</p>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition disabled:opacity-40" disabled>Previous</button>
            <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition">Next</button>
          </div>
        </div>
      </div>

      {/* Policy note */}
      <div className="mt-5 bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-4">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
          <AlertCircle className="w-4 h-4 text-blue-600" />
        </div>
        <p className="text-sm text-blue-700">
          As a verified Agent, you are required to conduct physical visits within <strong>48 hours</strong> of an accepted booking. Ensure you verify the Corp member's ID card before allowing entry to any property. Consultation fees are non-refundable once a visit is completed.
        </p>
      </div>
    </div>
  );
}

// ─── My Listings Page ────────────────────────────────────────────────────────
function MyListingsPage({ listings, onDelete, onNavigate }: {
  listings: Listing[];
  onDelete: (id: number) => void;
  onNavigate: (page: NavPage) => void;
}) {
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState<number | null>(null);

  const filtered = listings.filter(l =>
    l.apartment.toLowerCase().includes(search.toLowerCase()) ||
    l.location.toLowerCase().includes(search.toLowerCase())
  );

  const statusColors: Record<Listing["status"], string> = {
    Published: "bg-green-50 text-green-700",
    Pending: "bg-yellow-50 text-yellow-700",
    Draft: "bg-gray-100 text-gray-500",
    Rejected: "bg-red-50 text-red-600",
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Listings</h2>
          <p className="text-gray-500 text-sm mt-1">Manage your property portfolio and track verification status.</p>
        </div>
        <button onClick={() => onNavigate("create-listing")}
          className="flex items-center gap-2 bg-[#008A4B] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#006F3C] transition shadow-sm">
          <Plus className="w-4 h-4" /> Create New Listing
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-7">
        {[
          { label: "Total Listings", value: listings.length.toString(), note: "+2 this month", noteColor: "text-green-500" },
          { label: "Active/Published", value: listings.filter(l => l.status === "Published").length.toString(), note: "67% health", noteColor: "text-green-500" },
          { label: "Pending Approval", value: listings.filter(l => l.status === "Pending").length.toString(), note: "Avg. 24h wait", noteColor: "text-yellow-500" },
          { label: "Rejected/Action", value: listings.filter(l => l.status === "Rejected").length.toString(), note: "Requires update", noteColor: "text-red-500" },
        ].map(({ label, value, note, noteColor }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className={`text-xs font-medium ${noteColor} mb-1`}>{note}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-gray-900">Properties List</h3>
            <p className="text-xs text-gray-400 mt-0.5">A total of {filtered.length} properties found.</p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title or location..."
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#008A4B]/20 focus:border-[#008A4B] w-64 bg-gray-50" />
            </div>
            <button className="flex items-center gap-1.5 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition">
              <Filter className="w-3.5 h-3.5" /> Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/70 text-gray-400 text-xs uppercase tracking-wide border-b border-gray-100">
                <th className="font-medium py-3.5 px-6">Property</th>
                <th className="font-medium py-3.5 px-6">Location</th>
                <th className="font-medium py-3.5 px-6">Price</th>
                <th className="font-medium py-3.5 px-6">Rooms</th>
                <th className="font-medium py-3.5 px-6">Status</th>
                <th className="font-medium py-3.5 px-6">Date Added</th>
                <th className="font-medium py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400 text-sm">No listings found</td></tr>
              ) : filtered.map(l => (
                <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                        <img src={l.image} alt={l.apartment} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{l.apartment}</p>
                        <p className="text-xs text-gray-400">ID: #HF-{1000 + l.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">{l.location}</td>
                  <td className="py-4 px-6">
                    <span className="text-sm font-semibold text-[#008A4B]">{l.price.replace("/yr", "")}</span>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-500">{l.rooms}</td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[l.status]}`}>
                      {l.status === "Rejected" ? "⚠ Rejected" : l.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-500">{l.dateAdded}</td>
                  <td className="py-4 px-6 text-right relative">
                    <button onClick={() => setMenuOpen(menuOpen === l.id ? null : l.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-400 hover:text-gray-600">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {menuOpen === l.id && (
                      <div className="absolute right-6 top-full mt-1 w-40 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-10">
                        <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                        <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <div className="mx-3 my-1 border-t border-gray-100" />
                        <button onClick={() => { onDelete(l.id); setMenuOpen(null); }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition">
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-400">Showing 1–{filtered.length} of {listings.length} listings</p>
          <div className="flex gap-2">
            <button disabled className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-400 disabled:opacity-40">Previous</button>
            <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">Next</button>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="grid sm:grid-cols-2 gap-4 mt-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#008A4B] flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4" /> Pro-tip: Better Verification
          </p>
          <p className="text-sm text-gray-500">Listings with at least 4 high-quality photos and clear electricity descriptions are verified <strong>40% faster</strong> by our administrative team.</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-[#008A4B] flex items-center gap-2">
              <Calendar className="w-4 h-4" /> New Booking Requests
            </p>
            <button onClick={() => onNavigate("bookings")} className="text-xs text-[#008A4B] font-semibold hover:underline">View Bookings</button>
          </div>
          <p className="text-sm text-gray-500">You have <strong>3 new</strong> consultation requests pending for your Maitama property.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Settings Page ────────────────────────────────────────────────────────────
function SettingsPage() {
  const [profile, setProfile] = useState({
    name: "Babatunde Adeyemi", email: "babatunde@email.com",
    phone: "+234 801 234 5678", bio: "Verified property agent with 5+ years experience across Abuja, Lagos and Enugu.",
    state: "FCT Abuja",
  });
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<"profile" | "security" | "notifications">("profile");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault(); setSaved(true); setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>
      <div className="flex gap-2 mb-6 border-b border-gray-100 pb-1">
        {([
          { id: "profile", label: "Profile", icon: User },
          { id: "security", label: "Security", icon: Shield },
          { id: "notifications", label: "Notifications", icon: Bell },
        ] as { id: "profile" | "security" | "notifications"; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition ${tab === id ? "text-[#008A4B] border-b-2 border-[#008A4B]" : "text-gray-500 hover:text-gray-700"}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <form onSubmit={handleSave} className="space-y-5">
          <div className="flex items-center gap-5 p-5 bg-white rounded-2xl border border-gray-100">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-[#008A4B] flex items-center justify-center text-white font-bold text-2xl">BA</div>
              <button type="button" className="absolute -bottom-1 -right-1 w-7 h-7 bg-gray-800 text-white rounded-full flex items-center justify-center hover:bg-gray-700 transition">
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
            <div>
              <p className="font-semibold text-gray-900">{profile.name}</p>
              <p className="text-sm text-[#008A4B] flex items-center gap-1 mt-0.5"><CheckCircle className="w-3.5 h-3.5" /> Verified Agent</p>
              <p className="text-xs text-gray-400 mt-1">Member since January 2023</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#008A4B]/30 focus:border-[#008A4B]" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#008A4B]/30 focus:border-[#008A4B]" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#008A4B]/30 focus:border-[#008A4B]" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <select value={profile.state} onChange={e => setProfile({ ...profile, state: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#008A4B]/30 focus:border-[#008A4B] bg-white">
                  {["FCT Abuja","Lagos","Enugu","Rivers","Oyo","Kano"].map(s => <option key={s}>{s}</option>)}</select></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea rows={3} value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#008A4B]/30 focus:border-[#008A4B] resize-none" /></div>
          </div>
          <button type="submit" className="w-full bg-[#008A4B] text-white py-3 rounded-xl font-semibold hover:bg-[#006F3C] transition shadow-md">
            {saved ? "✓ Changes Saved!" : "Save Changes"}
          </button>
        </form>
      )}

      {tab === "security" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          {["Current Password", "New Password", "Confirm New Password"].map(l => (
            <div key={l}><label className="block text-sm font-medium text-gray-700 mb-1">{l}</label>
              <input type="password" placeholder="••••••••" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#008A4B]/30 focus:border-[#008A4B]" /></div>
          ))}
          <button className="w-full bg-[#008A4B] text-white py-3 rounded-xl font-semibold hover:bg-[#006F3C] transition shadow-md">Update Password</button>
        </div>
      )}

      {tab === "notifications" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          {[
            { label: "New consultation requests", desc: "When a corp member books a viewing" },
            { label: "Listing status updates", desc: "When your listing is approved or rejected" },
            { label: "New messages", desc: "When a member sends you a message" },
            { label: "Weekly earnings report", desc: "Every Monday morning" },
          ].map(({ label, desc }) => (
            <div key={label} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
              <div><p className="text-sm font-medium text-gray-800">{label}</p><p className="text-xs text-gray-400 mt-0.5">{desc}</p></div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-10 h-5 bg-gray-200 peer-checked:bg-[#008A4B] rounded-full transition after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition after:shadow peer-checked:after:translate-x-5" />
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main AgentDashboard ──────────────────────────────────────────────────────
export function AgentDashboard() {
  const [activePage, setActivePage] = useState<NavPage>("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [listings, setListings] = useState<Listing[]>([
    { id: 1, apartment: "Modern 2-Bedroom Flat", location: "Wuse, Abuja", price: "₦350,000/yr", rooms: "2 BHK", state: "FCT Abuja", status: "Published", consultations: 12, dateAdded: "Oct 12, 2023", image: LISTING_IMAGES[0] },
    { id: 2, apartment: "Self-Contained Studio", location: "New Haven, Enugu", price: "₦120,000/yr", rooms: "1 BHK", state: "Enugu", status: "Published", consultations: 5, dateAdded: "Oct 15, 2023", image: LISTING_IMAGES[1] },
    { id: 3, apartment: "3-Bedroom Duplex", location: "GRA Phase 2, PH", price: "₦800,000/yr", rooms: "3 BHK", state: "Rivers", status: "Pending", consultations: 0, dateAdded: "Oct 20, 2023", image: LISTING_IMAGES[2] },
    { id: 4, apartment: "1-Bedroom Apartment", location: "Bodija, Ibadan", price: "₦250,000/yr", rooms: "1 BHK", state: "Lagos", status: "Draft", consultations: 24, dateAdded: "Oct 22, 2023", image: LISTING_IMAGES[3] },
    { id: 5, apartment: "Luxury Penthouse", location: "Victoria Island, Lagos", price: "₦2,500,000/yr", rooms: "3 BHK", state: "Lagos", status: "Rejected", consultations: 0, dateAdded: "Oct 25, 2023", image: LISTING_IMAGES[4] },
  ]);

  const navItems: { id: NavPage; icon: React.ElementType; label: string; badge?: number }[] = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "listings", icon: Home, label: "My Listings" },
    { id: "bookings", icon: Calendar, label: "Bookings", badge: 3 },
    { id: "earnings", icon: DollarSign, label: "Earnings" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  const metrics = [
    { label: "Total Listings", value: String(listings.length), icon: Building, color: "text-green-600", bg: "bg-green-50" },
    { label: "Monthly Consultations", value: "48", icon: Users, color: "text-green-600", bg: "bg-green-50" },
    { label: "Total Earnings", value: "₦450,000", icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
    { label: "Rating", value: "4.8", icon: Star, color: "text-amber-500", bg: "bg-amber-50" },
  ];

  const filteredListings = listings.filter(l =>
    l.apartment.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pageTitle: Record<NavPage, string> = {
    dashboard: "Agent Overview", listings: "My Listings",
    bookings: "Bookings & Consultations", "create-listing": "Create New Listing",
    earnings: "Earnings", settings: "Settings",
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">

      {/* ── Sidebar ── */}
      <div className="w-60 bg-white border-r border-gray-100 flex flex-col shrink-0">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#008A4B] rounded-lg flex items-center justify-center">
              <Building className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-bold text-[#008A4B]">CorperHome</h1>
          </div>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1">
          {navItems.map(({ id, icon: Icon, label, badge }) => (
            <button key={id} onClick={() => setActivePage(id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activePage === id || (activePage === "create-listing" && id === "listings")
                  ? "bg-[#008A4B]/10 text-[#008A4B]"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              }`}>
              <Icon className="w-5 h-5 shrink-0" />
              <span className="flex-1 text-left">{label}</span>
              {badge && <span className="bg-[#008A4B] text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">{badge}</span>}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <button onClick={() => setActivePage("settings")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition text-left group">
            <div className="w-9 h-9 rounded-full bg-[#008A4B] flex items-center justify-center text-white font-bold text-sm shrink-0">BA</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">Babatunde A.</p>
              <p className="text-xs text-[#008A4B]">Verified Agent</p>
            </div>
            <Edit3 className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition shrink-0" />
          </button>
          <a href="/" className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-50 hover:text-red-500 transition mt-1">
            <LogOut className="w-4 h-4" /> Logout
          </a>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {activePage === "create-listing" && (
              <button onClick={() => setActivePage("listings")} className="flex items-center gap-1 text-gray-400 hover:text-gray-600 transition mr-2">
                ← Back
              </button>
            )}
            <h2 className="text-lg font-bold text-gray-900">{pageTitle[activePage]}</h2>
          </div>

          <div className="flex items-center gap-3">
            {activePage === "dashboard" && (
              <button onClick={() => setActivePage("create-listing")}
                className="flex items-center gap-2 bg-[#008A4B] hover:bg-[#006F3C] text-white px-4 py-2 rounded-xl text-sm font-medium transition shadow-sm">
                <Plus className="w-4 h-4" /> Post New Listing
              </button>
            )}

            <div className="relative">
              <button onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition">
                <div className="w-8 h-8 rounded-full bg-[#008A4B] flex items-center justify-center text-white font-bold text-xs">BA</div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">Agent Musa</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                  <button onClick={() => { setActivePage("settings"); setShowUserMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                    <User className="w-4 h-4 text-gray-400" /> Profile Settings
                  </button>
                  <div className="mx-4 my-1 border-t border-gray-100" />
                  <a href="/" className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition">
                    <LogOut className="w-4 h-4" /> Log Out
                  </a>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-7">

          {/* Dashboard */}
          {activePage === "dashboard" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-7">
                {metrics.map((m, i) => { const Icon = m.icon; return (
                  <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${m.bg} ${m.color}`}><Icon className="w-5 h-5" /></div>
                      <div><p className="text-xs text-gray-400 font-medium">{m.label}</p><p className="text-2xl font-bold text-gray-900 mt-0.5">{m.value}</p></div>
                    </div>
                  </div>
                ); })}
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-4">
                  <h3 className="font-bold text-gray-900">Active Listings</h3>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Search listings..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#008A4B]/20 focus:border-[#008A4B] w-56 bg-gray-50" />
                  </div>
                </div>
                <MyListingsPage listings={filteredListings} onDelete={id => setListings(prev => prev.filter(l => l.id !== id))} onNavigate={setActivePage} />
              </div>
            </>
          )}

          {activePage === "listings" && (
            <MyListingsPage listings={listings} onDelete={id => setListings(prev => prev.filter(l => l.id !== id))} onNavigate={setActivePage} />
          )}

          {activePage === "create-listing" && <CreateListingPage onBack={() => setActivePage("listings")} />}

          {activePage === "bookings" && <BookingsPage />}

          {activePage === "earnings" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {[
                  { label: "This Month", value: "₦75,000", change: "+12%" },
                  { label: "Total Earnings", value: "₦450,000", change: "+8%" },
                  { label: "Pending Payout", value: "₦25,000", change: "" },
                ].map(({ label, value, change }) => (
                  <div key={label} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <p className="text-sm text-gray-500 font-medium">{label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
                    {change && <p className="text-xs text-green-600 mt-1 font-medium">{change} from last month</p>}
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-bold text-gray-900">Transaction History</h3>
                  <button className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
                    <Download className="w-3.5 h-3.5" /> Export CSV
                  </button>
                </div>
                <div className="divide-y divide-gray-50">
                  {[
                    { desc: "Consultation — Amaka Obi", date: "Jun 17, 2026", amount: "+₦5,000" },
                    { desc: "Consultation — Chukwudi Nwosu", date: "Jun 15, 2026", amount: "+₦5,000" },
                    { desc: "Listing Boost — 2-Bedroom Flat", date: "Jun 10, 2026", amount: "-₦2,000" },
                    { desc: "Consultation — Emeka Dike", date: "Jun 8, 2026", amount: "+₦5,000" },
                  ].map((t, i) => (
                    <div key={i} className="flex items-center justify-between px-6 py-4">
                      <div><p className="text-sm font-medium text-gray-800">{t.desc}</p><p className="text-xs text-gray-400 mt-0.5">{t.date}</p></div>
                      <span className={`font-semibold text-sm ${t.amount.startsWith("+") ? "text-green-600" : "text-red-500"}`}>{t.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activePage === "settings" && <SettingsPage />}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-100 px-7 py-3 text-xs text-gray-400 flex justify-between">
          <span>© 2024 NYSC HomeFinder. All rights reserved.</span>
          <span className="flex gap-4"><a href="#" className="hover:text-gray-600">Terms</a><a href="#" className="hover:text-gray-600">Privacy</a></span>
        </footer>
      </div>
    </div>
  );
}
