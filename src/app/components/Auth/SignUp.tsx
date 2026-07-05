"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, Mail, Phone, ShieldCheck, Briefcase, FileText, 
  Upload, CheckCircle, ChevronLeft, ChevronRight, Lock 
} from "lucide-react";

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo",
  "Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa",
  "Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba",
  "Yobe","Zamfara"
];

export default function SignUp() {
  const [userType, setUserType] = useState<"corp" | "agent">("corp");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Corp Member Form State
  const [corpForm, setCorpForm] = useState({
    name: "",
    email: "",
    phone: "",
    batch: "",
    password: "",
    confirmPassword: "",
  });

  // Agent Form State (4 Steps)
  const [agentStep, setAgentStep] = useState(1);
  const [agentForm, setAgentForm] = useState({
    // Step 1: Personal
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    // Step 2: Professional
    agency: "",
    experience: "1-3 years",
    operatingStates: [] as string[],
    bio: "",
    // Step 3: Docs
    docType: "NIN Slip",
    docNumber: "",
    docUrl: "",
  });

  // Upload simulation states
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleSimulatedUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploading(true);
    setUploadProgress(0);
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setAgentForm(f => ({ ...f, docUrl: "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=300" })); // Mock verified image preview
          return 100;
        }
        return prev + 25;
      });
    }, 200);
  };

  const handleGoogleSignUp = (e: React.MouseEvent) => {
    e.preventDefault();
    document.cookie = `auth_role=${userType}; path=/; max-age=300`;
    const callbackUrl = userType === "corp" ? "/member" : "/agent";
    signIn("google", { callbackUrl });
  };

  // Corp signup submit handler
  const handleCorpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validations
    if (!corpForm.name || !corpForm.email || !corpForm.phone || !corpForm.batch || !corpForm.password) {
      setErrorMsg("All fields are required.");
      return;
    }
    if (corpForm.password !== corpForm.confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    if (corpForm.password.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: corpForm.name,
          email: corpForm.email,
          password: corpForm.password,
          role: "CORP",
          phone: corpForm.phone,
          batch: corpForm.batch
        })
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.message || "Registration failed.");
        setIsLoading(false);
        return;
      }

      // Log in automatically
      document.cookie = "auth_role=corp; path=/; max-age=300";
      await signIn("credentials", { 
        email: corpForm.email, 
        password: corpForm.password, 
        callbackUrl: "/member" 
      });
    } catch (err) {
      setErrorMsg("An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  // Agent wizard handlers
  const validateAgentStep = () => {
    setErrorMsg(null);
    if (agentStep === 1) {
      if (!agentForm.name || !agentForm.email || !agentForm.phone || !agentForm.password) {
        setErrorMsg("All fields are required.");
        return false;
      }
      if (agentForm.password !== agentForm.confirmPassword) {
        setErrorMsg("Passwords do not match.");
        return false;
      }
      if (agentForm.password.length < 8) {
        setErrorMsg("Password must be at least 8 characters.");
        return false;
      }
    }
    if (agentStep === 2) {
      if (!agentForm.bio || agentForm.bio.length < 50) {
        setErrorMsg("Bio must be at least 50 characters.");
        return false;
      }
      if (agentForm.operatingStates.length === 0) {
        setErrorMsg("Select at least one operating state.");
        return false;
      }
    }
    if (agentStep === 3) {
      if (!agentForm.docNumber) {
        setErrorMsg("Document ID number is required.");
        return false;
      }
      if (!agentForm.docUrl) {
        setErrorMsg("Please upload a scan of your document.");
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateAgentStep()) {
      setAgentStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setErrorMsg(null);
    setAgentStep(prev => prev - 1);
  };

  const handleAgentSubmit = async () => {
    if (!validateAgentStep()) return;
    setIsLoading(true);

    try {
      // Create user record via register route
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: agentForm.name,
          email: agentForm.email,
          password: agentForm.password,
          role: "AGENT",
          phone: agentForm.phone,
          // Custom agent fields can be updated in a subsequent DB profile call, 
          // or registered in the schema (for demo/prototype purposes we save phone & base role here)
        })
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.message || "Registration failed.");
        setIsLoading(false);
        return;
      }

      // Log in automatically
      document.cookie = "auth_role=agent; path=/; max-age=300";
      await signIn("credentials", { 
        email: agentForm.email, 
        password: agentForm.password, 
        callbackUrl: "/agent" 
      });
    } catch (err) {
      setErrorMsg("An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  const toggleStateSelection = (stateName: string) => {
    setAgentForm(f => {
      const alreadySelected = f.operatingStates.includes(stateName);
      return {
        ...f,
        operatingStates: alreadySelected 
          ? f.operatingStates.filter(s => s !== stateName) 
          : [...f.operatingStates, stateName]
      };
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-8 bg-card p-8 rounded-2xl shadow-sm border border-border">
        
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <span className="text-2xl font-black tracking-tight text-[#008A4B]">Corper<span className="text-slate-900">Home</span></span>
          </div>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            Create an Account
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Join the premium real estate portal for NYSC Corp Members
          </p>
        </div>

        {/* Toggle between Corp Member & Agent */}
        {agentStep === 1 && (
          <div className="flex rounded-lg bg-gray-100 p-1 border border-slate-200">
            <button
              type="button"
              className={`w-1/2 rounded-md py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                userType === "corp"
                  ? "bg-card text-gray-900 shadow"
                  : "text-gray-500 hover:text-gray-900"
              }`}
              onClick={() => {
                setUserType("corp");
                setErrorMsg(null);
              }}
            >
              Corp Member
            </button>
            <button
              type="button"
              className={`w-1/2 rounded-md py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                userType === "agent"
                  ? "bg-card text-gray-900 shadow"
                  : "text-gray-500 hover:text-gray-900"
              }`}
              onClick={() => {
                setUserType("agent");
                setErrorMsg(null);
              }}
            >
              Property Agent
            </button>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-xs text-center font-medium animate-in fade-in duration-200">
            {errorMsg}
          </div>
        )}

        {/* CORP SIGN UP (Single Page Form) */}
        {userType === "corp" && (
          <form className="space-y-4" onSubmit={handleCorpSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={corpForm.name}
                    onChange={e => setCorpForm({ ...corpForm, name: e.target.value })}
                    placeholder="Tunde Olayinka"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#008A4B] focus:border-[#008A4B] text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Email address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={corpForm.email}
                    onChange={e => setCorpForm({ ...corpForm, email: e.target.value })}
                    placeholder="tunde@nysc.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#008A4B] focus:border-[#008A4B] text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={corpForm.phone}
                    onChange={e => setCorpForm({ ...corpForm, phone: e.target.value })}
                    placeholder="+234 812..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#008A4B] focus:border-[#008A4B] text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">NYSC Batch</label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={corpForm.batch}
                    onChange={e => setCorpForm({ ...corpForm, batch: e.target.value })}
                    placeholder="Batch A 2026"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#008A4B] focus:border-[#008A4B] text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={corpForm.password}
                    onChange={e => setCorpForm({ ...corpForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#008A4B] focus:border-[#008A4B] text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={corpForm.confirmPassword}
                    onChange={e => setCorpForm({ ...corpForm, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#008A4B] focus:border-[#008A4B] text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 bg-[#008A4B] hover:bg-[#006F3C] text-white rounded-xl text-sm font-bold shadow-sm transition cursor-pointer"
              >
                {isLoading ? "Creating account..." : "Register as Corp Member"}
              </button>
            </div>
          </form>
        )}

        {/* AGENT SIGN UP (4-Step Wizard) */}
        {userType === "agent" && (
          <div className="space-y-6">
            
            {/* Step Stepper Header */}
            <div className="flex items-center justify-between mb-2">
              {[1, 2, 3, 4].map(step => (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition ${
                    agentStep > step ? 'bg-[#008A4B] text-white border-[#008A4B]' :
                    agentStep === step ? 'border-[#008A4B] text-[#008A4B] font-black scale-105 shadow-sm' :
                    'border-gray-200 text-gray-400 bg-secondary'
                  }`}>
                    {agentStep > step ? <CheckCircle className="w-4 h-4" /> : step}
                  </div>
                  {step < 4 && (
                    <div className={`h-0.5 flex-1 mx-2 ${agentStep > step ? 'bg-[#008A4B]' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {agentStep === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <h3 className="font-bold text-lg text-slate-800">Step 1: Personal Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Full Name</label>
                      <input
                        type="text"
                        value={agentForm.name}
                        onChange={e => setAgentForm({ ...agentForm, name: e.target.value })}
                        placeholder="John Agent"
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#008A4B] focus:border-[#008A4B] text-sm bg-card"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Email address</label>
                      <input
                        type="email"
                        value={agentForm.email}
                        onChange={e => setAgentForm({ ...agentForm, email: e.target.value })}
                        placeholder="john@agency.com"
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#008A4B] focus:border-[#008A4B] text-sm bg-card"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={agentForm.phone}
                      onChange={e => setAgentForm({ ...agentForm, phone: e.target.value })}
                      placeholder="+234 812..."
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#008A4B] focus:border-[#008A4B] text-sm bg-card"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Password</label>
                      <input
                        type="password"
                        value={agentForm.password}
                        onChange={e => setAgentForm({ ...agentForm, password: e.target.value })}
                        placeholder="••••••••"
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#008A4B] focus:border-[#008A4B] text-sm bg-card"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Confirm Password</label>
                      <input
                        type="password"
                        value={agentForm.confirmPassword}
                        onChange={e => setAgentForm({ ...agentForm, confirmPassword: e.target.value })}
                        placeholder="••••••••"
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#008A4B] focus:border-[#008A4B] text-sm bg-card"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {agentStep === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <h3 className="font-bold text-lg text-slate-800">Step 2: Professional Profile</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Agency Name (Optional)</label>
                      <div className="relative">
                        <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={agentForm.agency}
                          onChange={e => setAgentForm({ ...agentForm, agency: e.target.value })}
                          placeholder="e.g. Shell Realty"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#008A4B] focus:border-[#008A4B] text-sm bg-card"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Experience</label>
                      <select
                        value={agentForm.experience}
                        onChange={e => setAgentForm({ ...agentForm, experience: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#008A4B] focus:border-[#008A4B] text-sm bg-card"
                      >
                        <option value="< 1 year">Less than 1 year</option>
                        <option value="1-3 years">1-3 years</option>
                        <option value="3-5 years">3-5 years</option>
                        <option value="5+ years">5+ years</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Operating States (Multi-select)</label>
                    <div className="max-h-28 overflow-y-auto border border-gray-200 rounded-xl p-2 bg-secondary grid grid-cols-2 gap-2">
                      {NIGERIAN_STATES.map(st => {
                        const isSelected = agentForm.operatingStates.includes(st);
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => toggleStateSelection(st)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition text-left cursor-pointer ${
                              isSelected 
                                ? 'bg-green-50 border-green-300 text-green-700' 
                                : 'bg-card border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {st}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Bio / Description</label>
                      <span className={`text-[10px] font-bold ${agentForm.bio.length >= 50 && agentForm.bio.length <= 300 ? 'text-green-600' : 'text-slate-400'}`}>
                        {agentForm.bio.length} / 300 (min 50)
                      </span>
                    </div>
                    <textarea
                      value={agentForm.bio}
                      onChange={e => setAgentForm({ ...agentForm, bio: e.target.value.slice(0, 300) })}
                      placeholder="Tell us about yourself and the areas you operate in..."
                      className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#008A4B] focus:border-[#008A4B] text-sm bg-card h-24 resize-none"
                    />
                  </div>
                </motion.div>
              )}

              {agentStep === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <h3 className="font-bold text-lg text-slate-800">Step 3: Verification Documents</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Document Type</label>
                      <select
                        value={agentForm.docType}
                        onChange={e => setAgentForm({ ...agentForm, docType: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#008A4B] focus:border-[#008A4B] text-sm bg-card"
                      >
                        <option value="NIN Slip">NIN Slip</option>
                        <option value="Driver's License">Driver's License</option>
                        <option value="National Passport">National Passport</option>
                        <option value="Voter's Card">Voter's Card</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Document ID Number</label>
                      <div className="relative">
                        <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={agentForm.docNumber}
                          onChange={e => setAgentForm({ ...agentForm, docNumber: e.target.value })}
                          placeholder="e.g. 12345678901"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#008A4B] focus:border-[#008A4B] text-sm bg-card"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Upload Document Image</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#008A4B] transition relative bg-secondary overflow-hidden">
                      {isUploading ? (
                        <div className="py-4 space-y-2">
                          <p className="text-sm font-semibold text-muted-foreground">Uploading image...</p>
                          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                            <div className="bg-[#008A4B] h-full transition-all duration-200" style={{ width: `${uploadProgress}%` }}></div>
                          </div>
                        </div>
                      ) : agentForm.docUrl ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="relative w-40 h-24 border border-border rounded-lg overflow-hidden shadow-sm">
                            <Image src={agentForm.docUrl} alt="Document Preview" fill className="object-cover" />
                          </div>
                          <span className="text-xs text-green-600 font-bold flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Upload complete
                          </span>
                          <label className="text-[11px] text-[#008A4B] font-bold hover:underline cursor-pointer">
                            Replace Image
                            <input type="file" accept="image/*" onChange={handleSimulatedUpload} className="hidden" />
                          </label>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center gap-2 cursor-pointer py-4">
                          <Upload className="w-8 h-8 text-slate-400" />
                          <span className="text-xs font-bold text-slate-600">Drag & drop or Click to upload scan</span>
                          <span className="text-[10px] text-slate-400">Supports JPG, PNG, PDF up to 5MB</span>
                          <input type="file" accept="image/*" onChange={handleSimulatedUpload} className="hidden" />
                        </label>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {agentStep === 4 && (
                <motion.div
                  key="step-4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4 text-sm"
                >
                  <h3 className="font-bold text-lg text-slate-800">Step 4: Review your Information</h3>
                  
                  <div className="bg-secondary rounded-xl p-4 border border-border space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Full Name</span>
                      <span className="font-bold text-foreground text-right">{agentForm.name}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Email Address</span>
                      <span className="font-bold text-foreground text-right truncate">{agentForm.email}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Phone Number</span>
                      <span className="font-bold text-foreground text-right">{agentForm.phone}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Experience Level</span>
                      <span className="font-bold text-foreground text-right">{agentForm.experience}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Operating States</span>
                      <span className="font-bold text-foreground text-right line-clamp-1">{agentForm.operatingStates.join(", ")}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Document Uploaded</span>
                      <span className="font-bold text-green-700 text-right">{agentForm.docType} ({agentForm.docNumber})</span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    By submitting, you agree that all provided credentials are accurate and subject to manual verification by Neat & Affordable administrators.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stepper Wizard Actions */}
            <div className="flex justify-between items-center gap-3 border-t border-border pt-4">
              {agentStep > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="flex items-center gap-1 text-slate-500 hover:text-slate-900 border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              ) : (
                <div />
              )}
              
              {agentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex items-center gap-1 bg-[#008A4B] hover:bg-[#006F3C] text-white px-5 py-2.5 rounded-xl text-sm font-bold cursor-pointer"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleAgentSubmit}
                  disabled={isLoading}
                  className="flex items-center gap-1 bg-[#008A4B] hover:bg-[#006F3C] text-white px-6 py-2.5 rounded-xl text-sm font-bold cursor-pointer shadow-sm"
                >
                  {isLoading ? "Submitting..." : "Submit Registration"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        {agentStep === 1 && (
          <div className="mt-6 text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div>
              <div className="relative flex justify-center text-sm"><span className="bg-card px-2 text-gray-500 font-medium">Or continue with</span></div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={handleGoogleSignUp}
                className="flex w-full items-center justify-center rounded-xl border border-gray-300 bg-card py-2.5 px-4 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <Image className="mr-2" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width={20} height={20} />
                Google
              </button>
              <button
                type="button"
                className="flex w-full items-center justify-center rounded-xl border border-gray-300 bg-card py-2.5 px-4 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <Image className="mr-2" src="https://www.svgrepo.com/show/475647/facebook-color.svg" alt="Facebook" width={20} height={20} />
                Facebook
              </button>
            </div>
            
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/signin" className="font-semibold text-[#008A4B] hover:text-[#006F3C]">
                Sign in
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
