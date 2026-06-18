"use client";
import { useState } from "react";
import { MemberView } from "./components/MemberView";
import { AgentDashboard } from "./components/AgentDashboard";
import AdminPanel from "./components/AdminPanel";
import SignIn from "./components/Auth/SignIn";
import SignUp from "./components/Auth/SignUp";

function LandingPage({ onNavigate }: { onNavigate: (view: ViewState) => void }) {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 relative flex flex-col">
      {/* Hero Section */}
      <div className="relative w-full h-[65vh] bg-gray-900 flex flex-col">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/landing-bg.png')" }}
        />
        {/* Gradient Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-gray-50/80 to-transparent z-10" />
        
        {/* Header */}
        <header className="relative z-20 p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#008A4B] rounded-lg shadow-md"></div>
            <span className="font-bold text-xl tracking-tight text-gray-900">CorperHome</span>
          </div>
        </header>

        {/* Hero Content */}
        <div className="relative z-20 flex-1 flex flex-col justify-end px-6 pb-12 max-w-4xl mx-auto w-full">
          <div className="inline-flex items-center gap-2 text-[#008A4B] font-bold text-sm tracking-widest uppercase mb-4">
            <span className="w-2 h-2 rounded-full bg-[#008A4B]"></span>
            NOW LIVE IN 36 STATES
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 leading-[1.1] mb-6">
            Your Perfect PPA <br/>
            <span className="text-[#008A4B] relative inline-block">
              Apartment
              <span className="absolute bottom-1 left-0 w-full h-1 bg-[#008A4B]/30"></span>
            </span> Awaits.
          </h1>

          <p className="text-gray-700 text-lg md:text-xl max-w-2xl font-medium leading-relaxed mb-8">
            Built specifically for NYSC Corp members. Search by budget (₦100k - ₦1M), location, and verified electricity supply.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl">
            <button className="flex-1 bg-white text-gray-800 border border-gray-200 py-4 rounded-2xl font-semibold shadow-sm hover:bg-gray-50 transition">
              Verified Agents
            </button>
            <button className="flex-1 bg-white text-gray-800 border border-gray-200 py-4 rounded-2xl font-semibold shadow-sm hover:bg-gray-50 transition">
              Electricity Stats
            </button>
          </div>
        </div>
      </div>

      {/* Main Call to Actions */}
      <div className="relative z-20 flex flex-col items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md flex flex-col gap-4">
          <a 
            href="/signin"
            className="w-full text-center bg-[#008A4B] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#00733d] transition shadow-xl shadow-green-900/10 block"
          >
            Find an Apartment
          </a>
          
          <div className="text-center text-gray-500 font-medium my-2 text-sm tracking-widest uppercase">
            OR
          </div>

          <a 
            href="/signup"
            className="w-full text-center bg-white text-gray-900 border border-gray-200 py-4 rounded-2xl font-bold text-lg hover:bg-gray-50 transition shadow-sm block"
          >
            Join as an Agent
          </a>
        </div>

        <div className="mt-12 text-gray-600 font-medium">
          Already have an account? <a href="/signin" className="text-[#008A4B] font-bold hover:underline">Sign In</a>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return <LandingPage />;
}
