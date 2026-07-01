"use client";
import { useState } from "react";
import {
  Search, MapPin, BedDouble, Zap, Shield, Waves,
  Star, Heart, Phone, MessageCircle,
  Filter, X, CheckCircle, Home, Compass, Bookmark,
  Calendar, Send, ArrowLeft, LogOut, User, ChevronDown,
  Camera, Bell, Edit3
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Button } from "../../components/ui/button";
import Image from "next/image";

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "FCT Abuja", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina",
  "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun",
  "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba",
  "Yobe", "Zamfara"
];

const APARTMENTS = [
  {
    id: 1,
    title: "Modern 2-Bedroom Flat",
    location: "Wuse 2, FCT Abuja",
    state: "FCT Abuja",
    price: 350000,
    period: "year",
    bedrooms: 2,
    bathrooms: 2,
    electricity: 20,
    security: true,
    pool: false,
    rating: 4.7,
    reviews: 23,
    agent: "Emeka Properties Ltd",
    agentPhone: "+234 801 234 5678",
    agentVerified: true,
    image: "https://images.unsplash.com/photo-1705326701287-346fc37a2c86?w=600&h=400&fit=crop&auto=format",
    tags: ["Furnished", "Gen Set", "CCTV"],
  },
  {
    id: 2,
    title: "Self-Contained Studio",
    location: "New Haven, Enugu",
    state: "Enugu",
    price: 120000,
    period: "year",
    bedrooms: 1,
    bathrooms: 1,
    electricity: 18,
    security: true,
    pool: false,
    rating: 4.4,
    reviews: 11,
    agent: "Sunshine Realtors",
    agentPhone: "+234 802 345 6789",
    agentVerified: true,
    image: "https://images.unsplash.com/photo-1646987916641-1f3c8992daa2?w=600&h=400&fit=crop&auto=format",
    tags: ["Water Heater", "Parking"],
  },
  {
    id: 3,
    title: "3-Bedroom Duplex with Pool",
    location: "GRA Phase 2, Port Harcourt",
    state: "Rivers",
    price: 800000,
    period: "year",
    bedrooms: 3,
    bathrooms: 3,
    electricity: 24,
    security: true,
    pool: true,
    rating: 4.9,
    reviews: 38,
    agent: "Prestige Homes PH",
    agentPhone: "+234 803 456 7890",
    agentVerified: true,
    image: "https://images.unsplash.com/photo-1720247520862-7e4b14176fa8?w=600&h=400&fit=crop&auto=format",
    tags: ["Swimming Pool", "BQ", "Fully Furnished"],
  },
  {
    id: 4,
    title: "Mini Flat",
    location: "Bodija, Ibadan",
    state: "Oyo",
    price: 180000,
    period: "year",
    bedrooms: 1,
    bathrooms: 1,
    electricity: 14,
    security: false,
    pool: false,
    rating: 4.1,
    reviews: 7,
    agent: "Ibadan Housing Hub",
    agentPhone: "+234 804 567 8901",
    agentVerified: false,
    image: "https://images.unsplash.com/photo-1667584523543-d1d9cc828a15?w=600&h=400&fit=crop&auto=format",
    tags: ["Compact", "Near Market"],
  },
  {
    id: 5,
    title: "2-Bedroom Apartment",
    location: "Independence Layout, Enugu",
    state: "Enugu",
    price: 280000,
    period: "year",
    bedrooms: 2,
    bathrooms: 2,
    electricity: 16,
    security: true,
    pool: false,
    rating: 4.5,
    reviews: 19,
    agent: "Eastern Crown Realty",
    agentPhone: "+234 805 678 9012",
    agentVerified: true,
    image: "https://images.unsplash.com/photo-1667510436110-79d3dabc2008?w=600&h=400&fit=crop&auto=format",
    tags: ["Tiled Floors", "POP Ceiling"],
  },
  {
    id: 6,
    title: "Luxury 3-Bedroom Flat",
    location: "Victoria Island, Lagos",
    state: "Lagos",
    price: 950000,
    period: "year",
    bedrooms: 3,
    bathrooms: 4,
    electricity: 24,
    security: true,
    pool: true,
    rating: 4.8,
    reviews: 52,
    agent: "Lagos Prime Estates",
    agentPhone: "+234 806 789 0123",
    agentVerified: true,
    image: "https://images.unsplash.com/photo-1708113388262-17fdf0e21205?w=600&h=400&fit=crop&auto=format",
    tags: ["Serviced", "Gym", "Swimming Pool", "Smart Home"],
  },
];

const formatNaira = (amount: number) => `₦${amount.toLocaleString("en-NG")}`;

type Apt = typeof APARTMENTS[0];

// ─── Schedule Viewing Modal ───────────────────────────────────────────────────
function ScheduleModal({ apt, onClose }: { apt: Apt; onClose: () => void }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-card rounded-2xl w-full max-w-md p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full" onClick={onClose}>
          <X className="w-4 h-4" />
        </button>

        {submitted ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-[#008A4B]" />
            </div>
            <h3 className="text-xl font-bold mb-2">Viewing Scheduled!</h3>
            <p className="text-gray-500 text-sm mb-1">Your viewing for <strong>{apt.title}</strong></p>
            <p className="text-gray-500 text-sm mb-4">is booked for <strong>{date} at {time}</strong></p>
            <p className="text-xs text-gray-400">The agent will confirm within 24 hours. A consultation fee of <strong>₦5,000</strong> is payable on arrival.</p>
            <button
              onClick={onClose}
              className="mt-6 w-full bg-[#008A4B] text-white py-3 rounded-xl font-semibold hover:bg-[#006F3C] transition"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#008A4B]/10 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[#008A4B]" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Schedule a Viewing</h3>
                <p className="text-gray-500 text-xs">₦5,000 consultation fee</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 mb-5 flex gap-3 items-center">
              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                <Image src={apt.image} alt={apt.title} width={48} height={48} className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-semibold text-sm">{apt.title}</p>
                <p className="text-xs text-gray-500">{apt.location}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#008A4B]/30 focus:border-[#008A4B]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Time</label>
                <select
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#008A4B]/30 focus:border-[#008A4B] bg-card"
                >
                  <option value="">Select a time</option>
                  {["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter your full name"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#008A4B]/30 focus:border-[#008A4B]"
                />
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
                💳 A consultation fee of <strong>₦5,000</strong> is payable to the agent on the day of viewing.
              </div>
              <button
                type="submit"
                className="w-full bg-[#008A4B] text-white py-3 rounded-xl font-semibold hover:bg-[#006F3C] transition shadow-md"
              >
                Confirm Booking
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}

// ─── Message Agent Modal ──────────────────────────────────────────────────────
type Message = { from: "user" | "agent"; text: string; time: string };

function MessageModal({ apt, onClose }: { apt: Apt; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      from: "agent",
      text: `Hello! Thanks for your interest in ${apt.title}. How can I help you?`,
      time: "Now"
    }
  ]);
  const [draft, setDraft] = useState("");

  const send = () => {
    if (!draft.trim()) return;
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newMsg: Message = { from: "user", text: draft, time: now };
    setMessages(prev => [...prev, newMsg]);
    setDraft("");

    // Simulate agent reply after 1.5 s
    setTimeout(() => {
      const replies = [
        "Sure! I can arrange a viewing for you. What date works best?",
        "Yes, the apartment is still available. Let me know if you have any questions.",
        "The ₦5,000 consultation fee covers a full property tour and documentation walkthrough.",
        "Great choice! The property has stable electricity — 20+ hours daily on average."
      ];
      const reply: Message = {
        from: "agent",
        text: replies[Math.floor(Math.random() * replies.length)],
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages(prev => [...prev, reply]);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        className="relative bg-card rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md flex flex-col shadow-2xl"
        style={{ height: "80vh", maxHeight: 560 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 rounded-full bg-[#008A4B] flex items-center justify-center text-white font-bold text-sm shrink-0">
            {apt.agent.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{apt.agent}</p>
            <p className="text-xs text-[#008A4B]">● Online</p>
          </div>
          <a href={`tel:${apt.agentPhone}`} className="p-2 bg-[#008A4B]/10 rounded-xl">
            <Phone className="w-4 h-4 text-[#008A4B]" />
          </a>
        </div>

        {/* Listing pill */}
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-2 text-xs text-gray-500">
          <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0">
            <Image src={apt.image} alt={apt.title} width={28} height={28} className="w-full h-full object-cover" />
          </div>
          Re: {apt.title} — {apt.location}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm ${
                msg.from === "user"
                  ? "bg-[#008A4B] text-white rounded-br-sm"
                  : "bg-gray-100 text-gray-800 rounded-bl-sm"
              }`}>
                <p>{msg.text}</p>
                <p className={`text-[10px] mt-1 ${msg.from === "user" ? "text-white/70" : "text-gray-400"}`}>{msg.time}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-100 flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(); }}
            placeholder="Type a message..."
            className="flex-1 bg-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#008A4B]/30"
          />
          <button
            onClick={send}
            disabled={!draft.trim()}
            className="w-10 h-10 bg-[#008A4B] text-white rounded-xl flex items-center justify-center hover:bg-[#006F3C] transition disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Apartment Detail Modal ───────────────────────────────────────────────────
function ApartmentDetailModal({ apt, onClose }: { apt: Apt; onClose: () => void }) {
  const [tab, setTab] = useState<"overview" | "contact">("overview");
  const [showSchedule, setShowSchedule] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-64 bg-gray-100">
              <ImageWithFallback src={apt.image} alt={apt.title} className="w-full h-full object-cover" />
              <button className="absolute top-4 right-4 p-2 bg-card rounded-full shadow hover:scale-110 transition-transform" onClick={onClose}>
                <X className="w-4 h-4 text-black" />
              </button>
              {apt.agentVerified && (
                <div className="absolute top-4 left-4 flex items-center gap-1 bg-[#008A4B] text-white text-xs px-3 py-1.5 rounded-full shadow-md">
                  <CheckCircle className="w-3 h-3" /> Verified Agent
                </div>
              )}
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between mb-2">
                <h2 className="font-bold text-xl text-gray-900">{apt.title}</h2>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-semibold">{apt.rating}</span>
                  <span className="text-sm text-gray-500">({apt.reviews} reviews)</span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-gray-500 mb-4">
                <MapPin className="w-4 h-4" /> {apt.location}
              </div>

              <div className="flex gap-2 mb-6">
                {(["overview", "contact"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-4 py-2 rounded-full text-sm capitalize transition-colors relative ${tab === t ? "bg-[#008A4B] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {tab === "overview" && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: "Bedrooms", value: `${apt.bedrooms} bedroom${apt.bedrooms > 1 ? "s" : ""}`, icon: BedDouble },
                        { label: "Electricity", value: `${apt.electricity} hours/day`, icon: Zap },
                        { label: "Security", value: apt.security ? "24/7 Guarded" : "Not Included", icon: Shield },
                        { label: "Swimming Pool", value: apt.pool ? "Available" : "Not Available", icon: Waves },
                      ].map(({ label, value, icon: Icon }) => (
                        <div key={label} className="bg-gray-50 p-3 rounded-xl">
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className="w-4 h-4 text-[#008A4B]" />
                            <span className="text-xs text-gray-500">{label}</span>
                          </div>
                          <p className="text-sm font-medium">{value}</p>
                        </div>
                      ))}
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Amenities</p>
                      <div className="flex flex-wrap gap-2">
                        {apt.tags.map((tag) => (
                          <span key={tag} className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">{tag}</span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs text-gray-500 mb-1">Annual Rent</p>
                      <p className="text-2xl font-bold text-[#008A4B]">{formatNaira(apt.price)}</p>
                      <p className="text-xs text-gray-400 mt-1">≈ {formatNaira(Math.round(apt.price / 12))}/month</p>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowSchedule(true)}
                      className="w-full bg-amber-500 text-white py-3 rounded-xl font-semibold transition-transform shadow-md hover:bg-amber-600"
                    >
                      📅 Schedule a Viewing — ₦5,000 Consultation
                    </motion.button>
                  </motion.div>
                )}

                {tab === "contact" && (
                  <motion.div
                    key="contact"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4"
                  >
                    <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#008A4B] flex items-center justify-center text-white font-bold text-lg shrink-0">
                        {apt.agent.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold">{apt.agent}</p>
                        {apt.agentVerified && (
                          <div className="flex items-center gap-1 text-xs text-[#008A4B] mt-0.5">
                            <CheckCircle className="w-3 h-3" /> Verified Agent
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-0.5">Member since 2023</p>
                      </div>
                    </div>

                    <p className="text-sm text-gray-500">
                      Communication is handled through the CorperHome platform. A consultation fee of ₦5,000 unlocks direct contact.
                    </p>

                    <div className="flex gap-3">
                      <motion.a
                        href={`tel:${apt.agentPhone}`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 flex items-center justify-center gap-2 bg-[#008A4B] text-white py-3 rounded-xl font-medium shadow-md"
                      >
                        <Phone className="w-4 h-4" /> Call Agent
                      </motion.a>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowMessage(true)}
                        className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-800 py-3 rounded-xl font-medium"
                      >
                        <MessageCircle className="w-4 h-4" /> Message
                      </motion.button>
                    </div>

                    <p className="text-xs text-center text-gray-400">
                      Payments are secured via Paystack & Flutterwave
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Sub-modals */}
      <AnimatePresence>
        {showSchedule && <ScheduleModal apt={apt} onClose={() => setShowSchedule(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showMessage && <MessageModal apt={apt} onClose={() => setShowMessage(false)} />}
      </AnimatePresence>
    </>
  );
}

// ─── Apartment Card ───────────────────────────────────────────────────────────
function ApartmentCard({ apt, onView, saved, onToggleSave }: { apt: Apt; onView: (a: Apt) => void; saved: boolean; onToggleSave: (id: number) => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      className="bg-card rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-shadow duration-300 cursor-pointer"
      onClick={() => onView(apt)}
    >
      <div className="relative overflow-hidden h-48 bg-gray-100">
        <ImageWithFallback src={apt.image} alt={apt.title} className="w-full h-full object-cover" />
        <button
          className="absolute top-3 right-3 p-2 bg-white/90 rounded-full shadow-md hover:bg-white transition-colors"
          onClick={(e) => { e.stopPropagation(); onToggleSave(apt.id); }}
        >
          <Heart className={`w-4 h-4 ${saved ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
        </button>
        {apt.agentVerified && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-[#008A4B] text-white text-xs px-2 py-1 rounded-full">
            <CheckCircle className="w-3 h-3" /> Verified
          </div>
        )}
        <div className="absolute bottom-3 left-3 flex gap-1 flex-wrap">
          {apt.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="bg-black/60 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm">{tag}</span>
          ))}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-gray-900 leading-tight">{apt.title}</h3>
          <div className="flex items-center gap-1 shrink-0">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-sm font-medium">{apt.rating}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{apt.location}</span>
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
          <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" /> {apt.bedrooms} bed</span>
          <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> {apt.electricity}h/day</span>
          {apt.security && <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> Secured</span>}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <span className="text-lg font-bold text-[#008A4B]">{formatNaira(apt.price)}</span>
            <span className="text-xs text-gray-400">/{apt.period}</span>
          </div>
          <button
            className="text-sm bg-[#008A4B] text-white px-4 py-1.5 rounded-full hover:bg-[#006F3C] transition"
            onClick={(e) => { e.stopPropagation(); onView(apt); }}
          >
            View
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Member Profile Settings ────────────────────────────────────────────────
function MemberSettings({ onBack }: { onBack: () => void }) {
  const [profile, setProfile] = useState({
    name: "Corp Member", email: "member@example.com",
    phone: "+234 801 000 0000", state: "FCT Abuja",
    batch: "2024 Batch A",
  });
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<"profile" | "security" | "notifications">("profile");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-card border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-xl transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">Profile Settings</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 border-b border-gray-100 pb-1">
          {(["profile", "security", "notifications"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium transition capitalize ${tab === t ? "text-[#008A4B] border-b-2 border-[#008A4B]" : "text-gray-500 hover:text-gray-700"}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === "profile" && (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex items-center gap-4 bg-card rounded-2xl border border-gray-100 p-5">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-[#008A4B]/20 flex items-center justify-center text-[#008A4B] font-bold text-xl">
                  {profile.name.charAt(0)}
                </div>
                <button type="button" className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-800 text-white rounded-full flex items-center justify-center">
                  <Camera className="w-3 h-3" />
                </button>
              </div>
              <div>
                <p className="font-semibold">{profile.name}</p>
                <p className="text-xs text-gray-400">{profile.batch}</p>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-gray-100 p-5 space-y-4">
              {[
                { label: "Full Name", key: "name", type: "text" },
                { label: "Email Address", key: "email", type: "email" },
                { label: "Phone Number", key: "phone", type: "text" },
                { label: "Batch", key: "batch", type: "text" },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input type={type} value={profile[key as keyof typeof profile]}
                    onChange={e => setProfile({ ...profile, [key]: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#008A4B]/30 focus:border-[#008A4B]" />
                </div>
              ))}
            </div>

            <Button type="submit" className="w-full py-3 rounded-xl shadow-md text-base">
              {saved ? "✓ Changes Saved!" : "Save Changes"}
            </Button>
          </form>
        )}

        {tab === "security" && (
          <div className="bg-card rounded-2xl border border-gray-100 p-5 space-y-4">
            {["Current Password", "New Password", "Confirm New Password"].map(l => (
              <div key={l}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{l}</label>
                <input type="password" placeholder="••••••••" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#008A4B]/30 focus:border-[#008A4B]" />
              </div>
            ))}
            <Button className="w-full py-3 rounded-xl text-base">Update Password</Button>
          </div>
        )}

        {tab === "notifications" && (
          <div className="bg-card rounded-2xl border border-gray-100 p-5 space-y-3">
            {["New apartment listings", "Viewing confirmations", "Price drops on saved apartments", "Weekly newsletter"].map(label => (
              <div key={label} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <p className="text-sm font-medium text-gray-800">{label}</p>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-10 h-5 bg-gray-200 peer-checked:bg-[#008A4B] rounded-full transition after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition after:shadow peer-checked:after:translate-x-5" />
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main MemberView ──────────────────────────────────────────────────────────
export function MemberView() {
  const [activeTab, setActiveTab] = useState<"home" | "explore" | "saved">("home");
  const [showSettings, setShowSettings] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [selectedState, setSelectedState] = useState("");
  const [minBudget, setMinBudget] = useState(100000);
  const [maxBudget, setMaxBudget] = useState(1000000);
  const [bedrooms, setBedrooms] = useState<number | null>(null);
  const [filterPool, setFilterPool] = useState(false);
  const [filterSecurity, setFilterSecurity] = useState(false);
  const [filterElectricity, setFilterElectricity] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedApt, setSelectedApt] = useState<Apt | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [savedIds, setSavedIds] = useState<number[]>([]);

  const toggleSave = (id: number) =>
    setSavedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const filtered = APARTMENTS.filter((apt) => {
    if (activeTab === "saved") return savedIds.includes(apt.id);
    if (selectedState && apt.state !== selectedState) return false;
    if (apt.price < minBudget || apt.price > maxBudget) return false;
    if (bedrooms !== null && apt.bedrooms !== bedrooms) return false;
    if (filterPool && !apt.pool) return false;
    if (filterSecurity && !apt.security) return false;
    if (filterElectricity > 0 && apt.electricity < filterElectricity) return false;
    if (searchQuery && !apt.title.toLowerCase().includes(searchQuery.toLowerCase()) && !apt.location.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <>
    {showSettings && <MemberSettings onBack={() => setShowSettings(false)} />}
    {!showSettings && (
    <div className="min-h-screen bg-gray-50 pb-20">

      {/* ── Hero / Header ── */}
      {activeTab === "home" && (
        <div className="bg-[#008A4B] text-white">
          {/* Top bar with user menu */}
          <div className="max-w-6xl mx-auto px-4 pt-4 flex justify-end">
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-xl transition"
              >
                <div className="w-7 h-7 rounded-full bg-white/30 flex items-center justify-center font-bold text-xs">CM</div>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-card rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                  <button
                    onClick={() => { setShowSettings(true); setShowUserMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
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
          <div className="max-w-6xl mx-auto px-4 py-6 md:py-12">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-white/15 text-sm px-3 py-1.5 rounded-full mb-4">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                For NYSC Corp Members
              </div>
              <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-3">
                Find Your Home<br />Away From Home
              </h1>
              <p className="text-white/80 text-base mb-8">
                Search verified apartments across all 36 states — filtered to match your NYSC budget and needs.
              </p>

              <div className="bg-card rounded-2xl p-2 flex gap-2 shadow-lg">
                <div className="flex-1 flex items-center gap-2 px-3">
                  <Search className="w-4 h-4 text-gray-400 shrink-0" />
                  <input
                    className="w-full outline-none text-gray-900 text-sm bg-transparent placeholder:text-gray-400"
                    placeholder="Search by location or apartment type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 border-l border-gray-200 px-3">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  <select
                    className="outline-none text-sm text-gray-700 bg-transparent"
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                  >
                    <option value="">All States</option>
                    {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <Button className="px-5 py-2.5 rounded-xl shrink-0">
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Explore header ── */}
      {activeTab === "explore" && (
        <div className="bg-card border-b border-gray-100 px-4 py-5 max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Explore Apartments</h1>
          <div className="bg-gray-100 rounded-xl p-2 flex gap-2">
            <div className="flex-1 flex items-center gap-2 px-3">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                className="w-full outline-none text-gray-900 text-sm bg-transparent placeholder:text-gray-400"
                placeholder="Search location, title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Saved header ── */}
      {activeTab === "saved" && (
        <div className="bg-card border-b border-gray-100 px-4 py-5 max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold">Saved Apartments</h1>
          <p className="text-gray-500 text-sm mt-1">{savedIds.length} saved</p>
        </div>
      )}

      {/* ── Stats bar ── */}
      {activeTab === "home" && (
        <div className="bg-card border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-6 overflow-x-auto text-sm">
            {[
              { label: "Listed", value: "2,847" },
              { label: "States", value: "37" },
              { label: "Verified Agents", value: "194" },
              { label: "Members Housed", value: "12,400+" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center gap-2 shrink-0">
                <span className="font-bold text-[#008A4B]">{value}</span>
                <span className="text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Content ── */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {(activeTab === "home" || activeTab === "explore") && (
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-gray-900">
                {activeTab === "home" ? "Featured Apartments" : `${filtered.length} apartments found`}
              </h2>
              {selectedState && <p className="text-sm text-gray-400">in {selectedState}</p>}
            </div>
            <Button
              variant="outline"
              className="rounded-xl px-4 py-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" /> Filters
              {(filterPool || filterSecurity || bedrooms !== null || filterElectricity > 0) && (
                <span className="ml-2 bg-[#008A4B] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {[filterPool, filterSecurity, bedrooms !== null, filterElectricity > 0].filter(Boolean).length}
                </span>
              )}
            </Button>
          </div>
        )}

        <div className="flex gap-6">
          {/* Filters panel */}
          {showFilters && (
            <aside className="w-72 shrink-0">
              <div className="bg-card border border-gray-100 rounded-2xl p-5 space-y-6 sticky top-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Filters</h3>
                  <button
                    className="text-xs text-[#008A4B] hover:underline"
                    onClick={() => { setBedrooms(null); setFilterPool(false); setFilterSecurity(false); setFilterElectricity(0); setMinBudget(100000); setMaxBudget(1000000); }}
                  >Clear all</button>
                </div>

                <div>
                  <p className="text-sm font-medium mb-3">Budget Range (₦)</p>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-gray-400">Min</label>
                      <input type="number" className="w-full bg-gray-50 rounded-lg px-3 py-2 text-sm outline-none mt-1 border border-gray-200" value={minBudget} onChange={(e) => setMinBudget(Number(e.target.value))} step={50000} />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-400">Max</label>
                      <input type="number" className="w-full bg-gray-50 rounded-lg px-3 py-2 text-sm outline-none mt-1 border border-gray-200" value={maxBudget} onChange={(e) => setMaxBudget(Number(e.target.value))} step={50000} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{formatNaira(minBudget)} – {formatNaira(maxBudget)}</p>
                </div>

                <div>
                  <p className="text-sm font-medium mb-3">Bedrooms</p>
                  <div className="flex gap-2 flex-wrap">
                    {([null, 1, 2, 3] as (number | null)[]).map((n) => (
                      <button key={String(n)} onClick={() => setBedrooms(n)}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${bedrooms === n ? "bg-[#008A4B] text-white border-[#008A4B]" : "border-gray-200 hover:bg-gray-50"}`}>
                        {n === null ? "Any" : `${n} bed${n > 1 ? "s" : ""}`}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-3">Electricity Supply</p>
                  <div className="space-y-2">
                    {[0, 10, 16, 20, 24].map((h) => (
                      <label key={h} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="electricity" checked={filterElectricity === h} onChange={() => setFilterElectricity(h)} className="accent-[#008A4B]" />
                        <span className="text-sm">{h === 0 ? "Any" : `${h}+ hours/day`}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-3">Amenities</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={filterSecurity} onChange={(e) => setFilterSecurity(e.target.checked)} className="accent-[#008A4B] rounded" />
                      <span className="text-sm flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> 24/7 Security</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={filterPool} onChange={(e) => setFilterPool(e.target.checked)} className="accent-[#008A4B] rounded" />
                      <span className="text-sm flex items-center gap-1.5"><Waves className="w-3.5 h-3.5" /> Swimming Pool</span>
                    </label>
                  </div>
                </div>
              </div>
            </aside>
          )}

          <div className="flex-1">
            {filtered.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 text-gray-400">
                {activeTab === "saved" ? (
                  <>
                    <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="font-medium">No saved apartments yet</p>
                    <p className="text-sm">Tap the heart icon on any apartment to save it</p>
                  </>
                ) : (
                  <>
                    <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="font-medium">No apartments match your filters</p>
                    <p className="text-sm">Try adjusting your budget or location</p>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <AnimatePresence>
                  {filtered.map((apt) => (
                    <ApartmentCard
                      key={apt.id}
                      apt={apt}
                      onView={setSelectedApt}
                      saved={savedIds.includes(apt.id)}
                      onToggleSave={toggleSave}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom Navigation ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-gray-200 shadow-lg">
        <div className="max-w-lg mx-auto flex items-center">
          {([
            { id: "home", label: "Home", icon: Home },
            { id: "explore", label: "Explore", icon: Compass },
            { id: "saved", label: "Saved", icon: Bookmark },
          ] as { id: "home" | "explore" | "saved"; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex-1 flex flex-col items-center justify-center py-3 relative transition-colors"
            >
              {activeTab === id && (
                <motion.div
                  layoutId="navIndicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#008A4B] rounded-full"
                  transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
                />
              )}
              <Icon className={`w-5 h-5 mb-1 transition-colors ${activeTab === id ? "text-[#008A4B]" : "text-gray-400"}`} />
              <span className={`text-xs font-medium transition-colors ${activeTab === id ? "text-[#008A4B]" : "text-gray-400"}`}>
                {label}
              </span>
              {id === "saved" && savedIds.length > 0 && (
                <span className="absolute top-2 right-[28%] w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {savedIds.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* ── Detail Modal ── */}
      <AnimatePresence>
        {selectedApt && (
          <ApartmentDetailModal key="modal" apt={selectedApt} onClose={() => setSelectedApt(null)} />
        )}
      </AnimatePresence>
    </div>
    )}
    </>
  );
}
