"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import {
  MapPin,
  ShieldCheck,
  Zap,
  Search,
  ArrowRight,
  Menu,
  X,
  ChevronDown,
  Home,
  MessageSquare,
  CheckCircle,
  Flag,
} from "lucide-react";
import { PremiumButton } from "@/components/ui/premium-button";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { ListingCard, type ListingCardData } from "@/components/shared/ListingCard";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";

// Animated counter — shows the real number immediately, then animates when visible.
function useCountUp(end: number, duration: number = 2000, suffix: string = "", prefix: string = "") {
  const safeEnd = Number.isFinite(end) && end > 0 ? Math.floor(end) : 0;
  const [count, setCount] = useState(safeEnd);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    setCount(safeEnd);
  }, [safeEnd]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStarted(true);
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started || safeEnd <= 0) {
      setCount(safeEnd);
      return;
    }

    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCount(safeEnd);
      return;
    }

    setCount(0);
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextCount = Math.floor(eased * safeEnd);
      setCount((previous) => (previous === nextCount ? previous : nextCount));
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(step);
      } else {
        setCount(safeEnd);
      }
    };

    animationFrameRef.current = requestAnimationFrame(step);
    return () => {
      if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    };
  }, [started, safeEnd, duration]);

  return { count, ref, display: `${prefix}${count.toLocaleString()}${suffix}` };
}

function StatCard({ end, suffix = "", prefix = "", label }: { end: number; suffix?: string; prefix?: string; label: string }) {
  const { ref, display } = useCountUp(end, 2200, suffix, prefix);
  if (!Number.isFinite(end) || end <= 0) return null;
  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl md:text-5xl font-black text-[#008A4B] mb-2">{display}</div>
      <div className="text-gray-600 text-sm md:text-base font-medium">{label}</div>
    </div>
  );
}

const features = [
  {
    icon: MapPin,
    title: "PPA distance first",
    desc: "See how far a lodge is from your Place of Primary Assignment before you message an agent or schedule a viewing.",
    color: "bg-emerald-50 text-emerald-600",
    badge: "Core",
  },
  {
    icon: ShieldCheck,
    title: "Verified agents",
    desc: "Agents complete identity review before publishing. Look for the verified badge on listings and profiles.",
    color: "bg-blue-50 text-blue-600",
    badge: "Trust",
  },
  {
    icon: Zap,
    title: "Power feedback",
    desc: "Listings can show electricity-related amenities (generator, inverter). Always confirm during a physical viewing.",
    color: "bg-amber-50 text-amber-600",
    badge: "Practical",
  },
  {
    icon: MessageSquare,
    title: "In-app chat",
    desc: "Message agents inside the app after you create an account. No need to share personal numbers until you are ready.",
    color: "bg-purple-50 text-purple-600",
    badge: "Private",
  },
  {
    icon: Flag,
    title: "Report & safety",
    desc: "Report suspicious listings in-app. We never hold rent — pay the agent directly after you are satisfied.",
    color: "bg-rose-50 text-rose-600",
    badge: "Safety",
  },
];

const problems = [
  {
    icon: "🚨",
    text: "Scam agents who collect deposits and disappear before you see the property",
  },
  {
    icon: "📍",
    text: "Renting a place that turns out to be hours from your PPA secretariat",
  },
  {
    icon: "💡",
    text: "Moving in only to discover poor electricity and no way to compare options",
  },
];

type AppProps = {
  stats?: { listings: number; states: number; members: number; verifiedAgents: number };
  liveListings?: ListingCardData[];
};

export default function App({
  stats = { listings: 0, states: 0, members: 0, verifiedAgents: 0 },
  liveListings = [],
}: AppProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let animationFrame: number | null = null;
    const handleScroll = () => {
      if (animationFrame !== null) return;
      animationFrame = requestAnimationFrame(() => {
        animationFrame = null;
        const nextScrolled = window.scrollY > 20;
        setScrolled((previous) => (previous === nextScrolled ? previous : nextScrolled));
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    };
  }, []);

  const hasLive = liveListings.length > 0;

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden">
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-[#008A4B] rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <Home className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-xl text-gray-900">Neat & Affordable</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <Link href="/explore" className="hover:text-[#008A4B] transition-colors">
              Browse Homes
            </Link>
            <a href="#how-it-works" className="hover:text-[#008A4B] transition-colors">
              How It Works
            </a>
            <a href="#features" className="hover:text-[#008A4B] transition-colors">
              Features
            </a>
            <Link href="/faq" className="hover:text-[#008A4B] transition-colors">
              FAQ
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/signin" className="text-sm font-semibold text-gray-700 hover:text-[#008A4B] transition-colors px-4 py-2">
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-sm font-bold text-white bg-[#008A4B] hover:bg-[#006e3c] transition-colors px-5 py-2.5 rounded-xl shadow-sm"
            >
              Get Started Free
            </Link>
          </div>

          <button
            type="button"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-5 py-5 space-y-4 shadow-lg animate-in slide-in-from-top-4 duration-200">
            <Link href="/explore" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-gray-700 py-3">
              Browse Homes
            </Link>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-gray-700 py-3">
              How It Works
            </a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-gray-700 py-3">
              Features
            </a>
            <Link href="/faq" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-gray-700 py-3">
              FAQ
            </Link>
            <div className="pt-2 flex flex-col gap-3 border-t border-gray-100">
              <Link href="/signin" className="text-center text-sm font-semibold text-gray-700 border border-gray-200 py-3 rounded-xl">
                Sign In
              </Link>
              <Link href="/signup" className="text-center text-sm font-bold text-white bg-[#008A4B] py-3 rounded-xl">
                Get Started Free
              </Link>
            </div>
          </div>
        )}
      </nav>

      <section className="relative min-h-screen flex flex-col bg-[#0d1f15] overflow-hidden">
        <div className="absolute inset-0 z-0 bg-[url('/campstay-hero.png')] bg-cover bg-center bg-no-repeat" aria-hidden="true" />
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#0d1f15]/95 via-[#0d1f15]/60 to-transparent" />
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0d1f15] via-transparent to-transparent" />

        <div className="relative z-20 flex-1 flex items-center pt-24 pb-16 px-5 md:px-8">
          <div className="max-w-7xl mx-auto w-full">
            <div className="max-w-2xl">
              <motion.div
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 bg-[#008A4B]/20 border border-[#008A4B]/40 text-[#4ade80] text-xs font-bold px-4 py-2 rounded-full mb-8 backdrop-blur-sm"
              >
                <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse" />
                {stats.listings > 0
                  ? `LIVE LISTINGS IN ${stats.states || 1} STATE${stats.states === 1 ? "" : "S"}`
                  : "NOW ONBOARDING AGENTS AND CORPS MEMBERS"}
              </motion.div>

              <motion.h1
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-6 tracking-tight"
              >
                A safer home
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4ade80] to-[#22c55e]">
                  for your service year.
                </span>
              </motion.h1>

              <motion.p
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-gray-300 text-lg md:text-xl leading-relaxed mb-6 max-w-xl font-medium"
              >
                Browse verified lodges near your PPA. Chat and request viewings when you are ready — we never hold rent
                on this platform.
              </motion.p>

              <p className="mb-8 text-xs font-medium text-emerald-200/90">
                No rent held · Verified agents · Report in-app · Pay the agent directly
              </p>

              <motion.div
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link href="/explore">
                  <PremiumButton variant="light" className="w-full sm:w-auto text-base h-[60px] rounded-2xl">
                    Find lodges near my PPA <ArrowRight className="w-5 h-5 ml-2" />
                  </PremiumButton>
                </Link>
                <Link href="/signup?role=agent">
                  <span className="inline-flex h-[60px] w-full sm:w-auto items-center justify-center rounded-2xl border-2 border-white/40 px-8 text-base font-bold text-white transition hover:bg-white/10">
                    I'm an agent
                  </span>
                </Link>
              </motion.div>

              <div className="flex items-center gap-6 mt-10">
                <div className="text-gray-300 text-sm">
                  {stats.listings > 0 ? (
                    <>
                      <span className="font-bold text-white">{stats.listings.toLocaleString()}</span> live listing
                      {stats.listings === 1 ? "" : "s"}
                      {stats.states > 0 ? (
                        <>
                          {" "}
                          · {stats.states} state{stats.states === 1 ? "" : "s"}
                        </>
                      ) : null}
                    </>
                  ) : (
                    <span>Search first. Sign in only to chat, save, or book a viewing.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-20 flex justify-center pb-8">
          <a href="#live-listings" className="flex flex-col items-center gap-2 text-white/40 hover:text-white/70 transition-colors">
            <span className="text-xs font-medium">Scroll to explore</span>
            <ChevronDown className="w-5 h-5 animate-bounce" />
          </a>
        </div>
      </section>

      {/* Live listings or early-stage strip */}
      <section id="live-listings" className="bg-[#f6f8f6] py-16 px-5 md:px-8 border-b border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full mb-3">
                WHAT'S LIVE
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-gray-900">
                {hasLive ? "Published lodges right now" : "Listings are just getting started"}
              </h2>
              <p className="mt-2 text-sm text-gray-500 max-w-lg">
                {hasLive
                  ? "Real published homes from verified and pending agents. Browse freely — account only for chat and viewings."
                  : "Agents are onboarding. Browse explore anytime; create an account to save interest or chat when homes appear."}
              </p>
            </div>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 rounded-xl bg-[#008A4B] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#006e3c] shrink-0"
            >
              Open explore <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {hasLive ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {liveListings.slice(0, 4).map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-emerald-200 bg-white px-6 py-12 text-center">
              <p className="text-base font-semibold text-gray-900">No published lodges yet</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                We only show real database counts — not placeholders. Check explore after agents publish, or sign up to
                be notified when your state has homes.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link href="/explore" className="rounded-xl border border-emerald-200 px-5 py-2.5 text-sm font-bold text-[#008A4B]">
                  Browse explore
                </Link>
                <Link href="/signup" className="rounded-xl bg-[#008A4B] px-5 py-2.5 text-sm font-bold text-white">
                  Create account
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {(stats.states > 0 || stats.members > 0 || stats.listings > 0 || stats.verifiedAgents > 0) && (
        <section id="stats" className="bg-white py-16 border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-5 md:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-6">
              <StatCard end={stats.states} label="States with live homes" />
              <StatCard end={stats.members} label="Corps members signed up" />
              <StatCard end={stats.listings} label="Published listings" />
              <StatCard end={stats.verifiedAgents} label="Verified agents" />
            </div>
          </div>
        </section>
      )}

      <section className="bg-[#0d1f15] py-20 px-5 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-xl mb-10">
            <div className="inline-flex items-center gap-2 bg-white/10 text-[#4ade80] text-xs font-bold px-3 py-1.5 rounded-full mb-5">
              THE PROBLEM
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4">
              Housing stress should not define your service year
            </h2>
            <p className="text-gray-400 text-base leading-relaxed">
              Three pain points we designed around — no inflated claims, just the realities corps members face.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {problems.map((p, i) => (
              <div
                key={i}
                className="flex flex-col gap-3 bg-white/5 hover:bg-white/8 border border-white/10 rounded-2xl p-5 transition-all"
              >
                <div className="text-2xl">{p.icon}</div>
                <p className="text-gray-300 text-sm md:text-base font-medium leading-snug">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-gray-50 py-20 px-5 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full mb-5">
              HOW IT WORKS
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              From search to viewing
              <br className="hidden md:block" /> in three steps
            </h2>
            <p className="text-gray-500 text-base max-w-xl mx-auto">
              Browse as a guest. Create an account only when you want to chat or request a viewing.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-px bg-gradient-to-r from-[#008A4B] to-[#008A4B] border-t-2 border-dashed border-emerald-200 -translate-y-0.5" />
            {[
              {
                step: "01",
                icon: Search,
                title: "Search & filter",
                desc: "Filter by state, budget, and area. Open any published lodge without signing in.",
                color: "bg-emerald-500",
              },
              {
                step: "02",
                icon: MapPin,
                title: "Check PPA fit",
                desc: "Use distance and power cues on each card, then confirm routes yourself before you pay.",
                color: "bg-blue-500",
              },
              {
                step: "03",
                icon: CheckCircle,
                title: "Chat & view",
                desc: "Create a free account to message the agent, save homes, and request a viewing.",
                color: "bg-purple-500",
              },
            ].map(({ step, icon: Icon, title, desc, color }) => (
              <div
                key={step}
                className="relative bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 group"
              >
                <div
                  className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition-transform`}
                >
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

      <section id="features" className="bg-white py-20 px-5 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full mb-5">
              WHY NEAT & AFFORDABLE
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              Built for corps members
            </h2>
            <p className="text-gray-500 text-base max-w-xl mx-auto">
              Focused differentiators — PPA distance, verification, power cues, chat, and reporting. No rent escrow.
            </p>
          </div>
          <BentoGrid className="max-w-6xl mx-auto">
            {features.map(({ icon: Icon, title, desc, color, badge }, i) => (
              <BentoGridItem
                key={title}
                title={title}
                description={desc}
                className={i === 0 || i === 3 ? "md:col-span-2" : ""}
                header={
                  <div className="flex justify-between items-start w-full">
                    <div
                      className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center group-hover/bento:scale-110 transition-transform`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold bg-white border border-gray-200 text-gray-500 px-2.5 py-1 rounded-full">
                      {badge}
                    </span>
                  </div>
                }
              />
            ))}
          </BentoGrid>
        </div>
      </section>

      <TestimonialsSection />

      <section className="bg-white py-16 px-5 md:px-8 border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-[#0d1f15] to-[#1a3d25] rounded-3xl overflow-hidden p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-white/10 text-[#4ade80] text-xs font-bold px-3 py-1.5 rounded-full mb-6">
                FOR PROPERTY AGENTS
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-4 leading-tight">
                List verified homes for corps members
              </h2>
              <p className="text-gray-400 max-w-lg text-sm leading-relaxed">
                Complete verification, publish lodges, and respond to viewing requests. Rent is always paid between you
                and the tenant — not through the platform.
              </p>
            </div>
            <div className="flex-shrink-0 w-full md:w-auto">
              <Link
                href="/signup?role=agent"
                className="flex items-center justify-center gap-2 bg-[#008A4B] hover:bg-[#00a85a] text-white font-black px-10 py-5 rounded-2xl text-base transition-all hover:-translate-y-0.5 shadow-xl shadow-emerald-900/40 whitespace-nowrap"
              >
                Join as an agent <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#008A4B] py-20 px-5 md:px-8 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-5 leading-tight">
            Your service year home starts here
          </h2>
          <p className="text-emerald-100 text-base mb-4 leading-relaxed">
            Browse homes first, then create an account when you are ready to chat or request a viewing.
          </p>
          <p className="text-emerald-100/80 text-xs font-medium mb-8">
            No rent held · Verified agents · Report in-app · Pay the agent directly
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/explore"
              className="flex items-center justify-center gap-2 bg-white text-[#008A4B] font-black px-10 py-4 rounded-2xl text-base hover:bg-emerald-50 transition-all hover:-translate-y-0.5 shadow-xl"
            >
              Find lodges near my PPA <ArrowRight className="w-5 h-5" />
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
              <Link href="/explore" className="hover:text-white transition-colors">
                Browse Homes
              </Link>
              <a href="#how-it-works" className="hover:text-white transition-colors">
                How It Works
              </a>
              <Link href="/faq" className="hover:text-white transition-colors">
                FAQ
              </Link>
              <Link href="/safety" className="hover:text-white transition-colors">
                Safety
              </Link>
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms
              </Link>
              <Link href="/signin" className="hover:text-white transition-colors">
                Sign In
              </Link>
            </div>
            <p className="text-xs text-gray-600">© 2026 Neat & Affordable. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
