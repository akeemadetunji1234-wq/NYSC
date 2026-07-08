"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { MapPin, ShieldCheck, Zap, Search, Star, ArrowRight, Menu, X, ChevronDown, Building, Users, CheckCircle, Home, MessageSquare, TrendingUp, Clock } from "lucide-react";

// Animated counter hook
function useCountUp(end: number, duration: number = 2000, suffix: string = "", prefix: string = "") {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, end, duration]);

  return { count, ref, display: `${prefix}${count.toLocaleString()}${suffix}` };
}

function StatCard({ end, suffix = "", prefix = "", label }: { end: number; suffix?: string; prefix?: string; label: string }) {
  const { count, ref, display } = useCountUp(end, 2200, suffix, prefix);
  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl md:text-5xl font-black text-[#008A4B] mb-2">{display}</div>
      <div className="text-gray-600 text-sm md:text-base font-medium">{label}</div>
    </div>
  );
}

const testimonials = [
  {
    name: "Chukwuemeka O.",
    batch: "Batch B, 2024  Benue State",
    text: "Within 3 days of arriving at camp, I had already found, viewed, and secured my apartment through Neat & Affordable. The PPA distance estimator saved me so much stress!",
    rating: 5,
    avatar: "CO"
  },
  {
    name: "Fatima A.",
    batch: "Batch A, 2025  Rivers State",
    text: "I was skeptical at first, but the agent verification badge gave me peace of mind. My agent was professional and the apartment was exactly as described.",
    rating: 5,
    avatar: "FA"
  },
  {
    name: "Babatunde S.",
    batch: "Batch C, 2024 Lagos State",
    text: "Being a corper in Lagos without Neat & Affordable is a nightmare. This app made it so much easier — I could filter by electricity supply and PPA distance at the same time!",
    rating: 5,
    avatar: "BS"
  },
  {
    name: "Ngozi E.",
    batch: "Batch A, 2025 Kano State",
    text: "Moving from Enugu to Kano was scary, but Neat & Affordable helped me find a safe, affordable apartment near my PPA before I even left home. Highly recommend.",
    rating: 5,
    avatar: "NE"
  }
];

const features = [
  {
    icon: MapPin,
    title: "PPA-Distance Intelligence",
    desc: "Our commute estimator shows real-time distance, travel time, and cost estimates from any apartment to your PPA secretariat — before you even schedule a viewing.",
    color: "bg-emerald-50 text-emerald-600",
    badge: "Unique to Neat & Affordable"
  },
  {
    icon: ShieldCheck,
    title: "Verified Agents Only",
    desc: "Every agent on Neat & Affordable undergoes manual background checks, ID verification, and credential review before they can list a single property.",
    color: "bg-blue-50 text-blue-600",
    badge: "100% Verified"
  },
  {
    icon: Zap,
    title: "Electricity Supply Ratings",
    desc: "We collect real feedback from previous tenants and display an electricity supply score for every listing and no more surprises about power outages.",
    color: "bg-amber-50 text-amber-600",
    badge: "Tenant-Sourced"
  },
  {
    icon: MessageSquare,
    title: "In-App Agent Chat",
    desc: "Communicate directly with property agents without sharing personal contact details until you're ready. Book viewings with one tap.",
    color: "bg-purple-50 text-purple-600",
    badge: "Private & Secure"
  },
  {
    icon: Search,
    title: "Smart Search & Filters",
    desc: "Filter by budget (₦100k–₦1M+), bedroom count, proximity to PPA, state, LGA, and amenities like Wi-Fi, water supply, and security.",
    color: "bg-rose-50 text-rose-600",
    badge: "36 States"
  },
  {
    icon: TrendingUp,
    title: "Real-Time Availability",
    desc: "Listings are updated in real time by agents. Once a property is booked, it disappears from search and you only see what's actually available.",
    color: "bg-cyan-50 text-cyan-600",
    badge: "Always Fresh"
  }
];

const problems = [
  { icon: "😤", text: "Arriving at a new state and spending weeks searching for housing through strangers on WhatsApp groups" },
  { icon: "🚨", text: "Scam agents who collect deposits and disappear before you even see the property" },
  { icon: "💡", text: "Moving into an apartment only to discover it has 4 hours of electricity daily" },
  { icon: "📍", text: "Renting a place that turns out to be 2 hours away from your PPA secretariat" },
  { icon: "💸", text: "Overpaying for housing because you had no time to compare prices in an unfamiliar city" },
];

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden">
      {/* ═══════════════ NAVBAR ═══════════════ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-[#008A4B] rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <Home className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-xl text-gray-900">Neat & Affordable</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#how-it-works" className="hover:text-[#008A4B] transition-colors">How It Works</a>
            <a href="#features" className="hover:text-[#008A4B] transition-colors">Features</a>
            <a href="#testimonials" className="hover:text-[#008A4B] transition-colors">Testimonials</a>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/signin" className="text-sm font-semibold text-gray-700 hover:text-[#008A4B] transition-colors px-4 py-2">
              Sign In
            </Link>
            <Link href="/signup" className="text-sm font-bold text-white bg-[#008A4B] hover:bg-[#006e3c] transition-colors px-5 py-2.5 rounded-xl shadow-sm">
              Get Started Free
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-5 py-5 space-y-4 shadow-lg animate-in slide-in-from-top-4 duration-200">
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-gray-700 py-2">How It Works</a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-gray-700 py-2">Features</a>
            <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-gray-700 py-2">Testimonials</a>
            <div className="pt-2 flex flex-col gap-3 border-t border-gray-100">
              <Link href="/signin" className="text-center text-sm font-semibold text-gray-700 border border-gray-200 py-3 rounded-xl">Sign In</Link>
              <Link href="/signup" className="text-center text-sm font-bold text-white bg-[#008A4B] py-3 rounded-xl">Get Started Free</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative min-h-screen flex flex-col bg-[#0d1f15] overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: "url('/campstay-hero.png')",
            backgroundSize: "cover",
            backgroundPosition: "center top",
          }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#0d1f15]/95 via-[#0d1f15]/60 to-transparent" />
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0d1f15] via-transparent to-transparent" />

        {/* Hero Content */}
        <div className="relative z-20 flex-1 flex items-center pt-24 pb-16 px-5 md:px-8">
          <div className="max-w-7xl mx-auto w-full">
            <div className="max-w-2xl">
              {/* Badge */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 bg-[#008A4B]/20 border border-[#008A4B]/40 text-[#4ade80] text-xs font-bold px-4 py-2 rounded-full mb-8 backdrop-blur-sm"
              >
                <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse" />
                NOW LIVE IN ALL 36 STATES + FCT
              </motion.div>

              {/* Headline */}
              <motion.h1 
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
                className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-6 tracking-tight"
              >
                Housing for<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4ade80] to-[#22c55e]">
                  Every Corper.
                </span><br />
                Everywhere.
              </motion.h1>

              {/* Sub */}
              <motion.p 
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}
                className="text-gray-300 text-lg md:text-xl leading-relaxed mb-10 max-w-xl font-medium"
              >
                Neat & Affordable connects NYSC Corp members with verified, affordable apartments near their PPA, eliminating scams, guesswork, and housing stress during service year.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/signin"
                    className="flex items-center justify-center gap-2 bg-[#008A4B] hover:bg-[#00a85a] transition-all text-white font-bold px-8 py-4 rounded-2xl text-base shadow-xl shadow-green-900/30"
                  >
                    Find My Apartment <ArrowRight className="w-5 h-5" />
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/signup"
                    className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-8 py-4 rounded-2xl text-base backdrop-blur-sm transition-all"
                  >
                    <Building className="w-5 h-5" /> List as an Agent
                  </Link>
                </motion.div>
              </motion.div>

              {/* Trust line */}
              <div className="flex items-center gap-6 mt-10">
                <div className="flex -space-x-2">
                  {["CO","FA","BS","NE"].map((initials, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 border-2 border-[#0d1f15] flex items-center justify-center text-white text-[10px] font-bold">
                      {initials}
                    </div>
                  ))}
                </div>
                <div className="text-gray-300 text-sm">
                  <span className="font-bold text-white">2,400+</span> corpers housed this batch
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="relative z-20 flex justify-center pb-8">
          <a href="#stats" className="flex flex-col items-center gap-2 text-white/40 hover:text-white/70 transition-colors">
            <span className="text-xs font-medium">Scroll to explore</span>
            <ChevronDown className="w-5 h-5 animate-bounce" />
          </a>
        </div>
      </section>

      {/* ═══════════════ STATS ═══════════════ */}
      <section id="stats" className="bg-white py-20 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-5 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-6">
            <StatCard end={36} suffix="+" label="States & Territories Covered" />
            <StatCard end={2400} suffix="+" label="Corp Members Housed" />
            <StatCard end={850} suffix="+" label="Verified Properties Listed" />
            <StatCard end={98} suffix="%" label="Tenant Satisfaction Rate" />
          </div>
        </div>
      </section>

      {/* ═══════════════ THE PROBLEM ═══════════════ */}
      <section className="bg-[#0d1f15] py-24 px-5 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-xl mb-14">
            <div className="inline-flex items-center gap-2 bg-white/10 text-[#4ade80] text-xs font-bold px-3 py-1.5 rounded-full mb-5">
              THE PROBLEM
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-5">
              The NYSC housing crisis is real. We fixed it.
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed">
              Every year, hundreds of thousands of corp members face the same nightmare. We built Neat & Affordable to end it.
            </p>
          </div>

          <div className="space-y-4">
            {problems.map((p, i) => (
              <div
                key={i}
                className="flex items-start gap-5 bg-white/5 hover:bg-white/8 border border-white/10 rounded-2xl p-5 transition-all group cursor-default"
              >
                <div className="text-3xl flex-shrink-0 mt-0.5">{p.icon}</div>
                <p className="text-gray-300 text-base md:text-lg font-medium leading-snug group-hover:text-white transition-colors">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <section id="how-it-works" className="bg-gray-50 py-24 px-5 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full mb-5">
              HOW IT WORKS
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-5">
              From camp to apartment<br className="hidden md:block"/> in 3 simple steps
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              No middlemen. No guesswork. Just a straightforward path to your perfect corper apartment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-px bg-gradient-to-r from-[#008A4B] to-[#008A4B] border-t-2 border-dashed border-emerald-200 -translate-y-0.5" />

            {[
              { step: "01", icon: Search, title: "Search & Filter", desc: "Enter your posting state, PPA location, and budget. Our smart search surfaces only verified, available apartments that match.", color: "bg-emerald-500" },
              { step: "02", icon: MapPin, title: "Estimate & Compare", desc: "Use our commute estimator to compare real driving distances, travel time, and transport costs from each apartment to your PPA.", color: "bg-blue-500" },
              { step: "03", icon: CheckCircle, title: "Connect & Secure", desc: "Contact the verified agent directly via in-app chat, WhatsApp, or phone. Schedule viewings and finalize your lease on your terms.", color: "bg-purple-500" },
            ].map(({ step, icon: Icon, title, desc, color }) => (
              <div key={step} className="relative bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 group">
                <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-xs font-black text-gray-300 mb-3 tracking-wider">STEP {step}</div>
                <h3 className="text-xl font-black text-gray-900 mb-3">{title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ FEATURES ═══════════════ */}
      <section id="features" className="bg-white py-24 px-5 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full mb-5">
              WHY NEAT & AFFORDABLE
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-5">
              Built for corp members.<br className="hidden md:block" /> By people who get it.
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Every feature was designed specifically for the NYSC housing experience not adapted from a generic real estate platform.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc, color, badge }) => (
              <div key={title} className="bg-gray-50 rounded-3xl p-7 border border-gray-100 hover:bg-white hover:border-gray-200 hover:shadow-lg transition-all hover:-translate-y-1 group">
                <div className="flex items-start justify-between mb-5">
                  <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold bg-white border border-gray-200 text-gray-500 px-2.5 py-1 rounded-full">{badge}</span>
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-3">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ TESTIMONIALS ═══════════════ */}
      <section id="testimonials" className="bg-gray-50 py-24 px-5 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full mb-5">
              TESTIMONIALS
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-5">
              Trusted by corpers<br className="hidden md:block" /> across Nigeria
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map(({ name, batch, text, rating, avatar }) => (
              <div key={name} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                {/* Stars */}
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-base leading-relaxed mb-6 font-medium italic">"{text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#008A4B] to-emerald-400 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                    {avatar}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm">{name}</div>
                    <div className="text-gray-500 text-xs">{batch}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ FOR AGENTS CTA ═══════════════ */}
      <section className="bg-white py-20 px-5 md:px-8 border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-[#0d1f15] to-[#1a3d25] rounded-3xl overflow-hidden p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-white/10 text-[#4ade80] text-xs font-bold px-3 py-1.5 rounded-full mb-6">
                FOR PROPERTY AGENTS
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
                Reach thousands of verified<br className="hidden md:block" /> tenants every batch cycle.
              </h2>
              <p className="text-gray-400 max-w-lg text-base leading-relaxed">
                List your properties on Neat & Affordable and connect with qualified, identity-verified NYSC corp members actively looking for housing. No wasted leads.
              </p>
              <div className="flex flex-wrap gap-5 mt-8 justify-center md:justify-start text-sm text-gray-300">
                {["Free to join", "Verification badge", "Real-time bookings", "WhatsApp integration"].map(item => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-shrink-0 w-full md:w-auto">
              <Link
                href="/signup"
                className="flex items-center justify-center gap-2 bg-[#008A4B] hover:bg-[#00a85a] text-white font-black px-10 py-5 rounded-2xl text-base transition-all hover:-translate-y-0.5 shadow-xl shadow-emerald-900/40 whitespace-nowrap"
              >
                Join as an Agent <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <section className="bg-[#008A4B] py-24 px-5 md:px-8 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
            Your service year home<br />starts here.
          </h2>
          <p className="text-emerald-100 text-lg mb-10 leading-relaxed">
            Join thousands of corp members who found safe, affordable, verified housing through Neat & Affordable and before they even got to their posting state.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signin"
              className="flex items-center justify-center gap-2 bg-white text-[#008A4B] font-black px-10 py-4 rounded-2xl text-base hover:bg-emerald-50 transition-all hover:-translate-y-0.5 shadow-xl"
            >
              Find an Apartment <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/signin"
              className="flex items-center justify-center gap-2 bg-transparent border-2 border-white/40 text-white font-bold px-10 py-4 rounded-2xl text-base hover:bg-white/10 transition-all hover:-translate-y-0.5"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="bg-[#0d1f15] text-gray-400 py-12 px-5 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-[#008A4B] rounded-lg flex items-center justify-center">
                <Home className="w-4 h-4 text-white" />
              </div>
              <span className="font-black text-lg text-white">Neat & Affordable</span>
            </div>
            <div className="flex flex-wrap gap-6 text-sm justify-center">
              <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a>
              <Link href="/signin" className="hover:text-white transition-colors">Sign In</Link>
              <Link href="/signup" className="hover:text-white transition-colors">Register</Link>
            </div>
            <p className="text-xs text-gray-600">© 2025 Neat & Affordable. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
