"use client";

import { PageTransition } from "../../../components/layout/PageTransition";
import { User, Mail, ShieldCheck, Phone, MapPin, Building, CreditCard, LogOut, Bell } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useSession, signOut } from "next-auth/react";

export default function MemberProfilePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user as any;
  
  // Profile information states
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    fullName: user?.name || "Corp Member",
    email: user?.email || "",
    phone: user?.phone || "",
    stateCode: "",
    ppa: ""
  });
  
  const [tempProfile, setTempProfile] = useState(profile);

  const handleEditToggle = () => {
    if (isEditing) {
      if (!tempProfile.fullName.trim() || !tempProfile.email.trim()) {
        toast.error("Name and Email are required");
        return;
      }
      setProfile(tempProfile);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } else {
      setTempProfile(profile);
      setIsEditing(true);
    }
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: "/signin" });
  };

  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
          <p className="text-slate-500 mt-1">Manage your personal information and NYSC details.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Profile Sidebar */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center">
              <div className="w-24 h-24 bg-[#008A4B] rounded-full mx-auto flex items-center justify-center text-3xl font-bold text-white shadow-md mb-4 relative overflow-hidden">
                {user?.image ? (
                  <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  profile.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
                )}
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              <h2 className="text-lg font-bold text-slate-900">{profile.fullName}</h2>
              <p className="text-sm text-slate-500 mb-4">{profile.email}</p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold">
                Verified Corper
              </div>
            </div>

            {/* Quick Actions/Nav */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
               <button className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition border-b border-slate-100">
                  <CreditCard className="w-5 h-5 text-slate-400" />
                  <span className="font-medium text-slate-700">Payment Methods</span>
               </button>
               <button className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition border-b border-slate-100">
                  <Bell className="w-5 h-5 text-slate-400" />
                  <span className="font-medium text-slate-700">Notifications</span>
               </button>
            </div>

            <Button 
              onClick={handleSignOut}
              variant="outline" 
              className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl flex items-center justify-center gap-2 py-5 cursor-pointer font-medium"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          </div>

          {/* Profile Content */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Personal Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="text-lg font-bold text-slate-900">Personal Information</h3>
                <div className="flex gap-2">
                  {isEditing && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsEditing(false)}
                      className="text-slate-500 hover:text-slate-700 font-medium rounded-lg"
                    >
                      Cancel
                    </Button>
                  )}
                  <Button 
                    variant={isEditing ? "default" : "outline"} 
                    size="sm" 
                    onClick={handleEditToggle}
                    className={`${isEditing ? "bg-[#008A4B] hover:bg-[#006F3C] text-white" : "bg-white text-[#008A4B] border-[#008A4B] hover:bg-green-50"} rounded-lg px-4 font-medium`}
                  >
                    {isEditing ? "Save Changes" : "Edit Profile"}
                  </Button>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-slate-500 flex items-center gap-2 mb-1">
                      <User className="w-4 h-4" /> Full Name
                    </label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={tempProfile.fullName} 
                        onChange={(e) => setTempProfile({...tempProfile, fullName: e.target.value})} 
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#008A4B]/30 focus:border-[#008A4B] transition"
                      />
                    ) : (
                      <p className="font-medium text-slate-900 bg-slate-50 px-3 py-2 rounded-xl">{profile.fullName}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500 flex items-center gap-2 mb-1">
                      <Mail className="w-4 h-4" /> Email Address
                    </label>
                    {isEditing ? (
                      <input 
                        type="email" 
                        value={tempProfile.email} 
                        onChange={(e) => setTempProfile({...tempProfile, email: e.target.value})} 
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#008A4B]/30 focus:border-[#008A4B] transition"
                      />
                    ) : (
                      <p className="font-medium text-slate-900 bg-slate-50 px-3 py-2 rounded-xl">{profile.email}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500 flex items-center gap-2 mb-1">
                      <Phone className="w-4 h-4" /> Phone Number
                    </label>
                    {isEditing ? (
                      <input 
                        type="tel" 
                        value={tempProfile.phone} 
                        onChange={(e) => setTempProfile({...tempProfile, phone: e.target.value})} 
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#008A4B]/30 focus:border-[#008A4B] transition"
                      />
                    ) : (
                      <p className="font-medium text-slate-900 bg-slate-50 px-3 py-2 rounded-xl">{profile.phone}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* NYSC Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50">
                <h3 className="text-lg font-bold text-slate-900">NYSC Details</h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-slate-500 flex items-center gap-2 mb-1">
                      <ShieldCheck className="w-4 h-4" /> State Code
                    </label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={tempProfile.stateCode} 
                        onChange={(e) => setTempProfile({...tempProfile, stateCode: e.target.value})} 
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#008A4B]/30 focus:border-[#008A4B] transition"
                      />
                    ) : (
                      <p className="font-medium text-slate-900 bg-slate-50 px-3 py-2 rounded-xl">{profile.stateCode}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500 flex items-center gap-2 mb-1">
                      <Building className="w-4 h-4" /> PPA (Place of Primary Assignment)
                    </label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={tempProfile.ppa} 
                        onChange={(e) => setTempProfile({...tempProfile, ppa: e.target.value})} 
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#008A4B]/30 focus:border-[#008A4B] transition"
                      />
                    ) : (
                      <p className="font-medium text-slate-900 bg-slate-50 px-3 py-2 rounded-xl">{profile.ppa}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </PageTransition>
  );
}
