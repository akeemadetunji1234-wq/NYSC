"use client";

import { PageTransition } from "../../../components/layout/PageTransition";
import { User, Mail, ShieldCheck, Phone, MapPin, Building, CreditCard, LogOut, Bell, Navigation } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useSession, signOut } from "next-auth/react";
import { getUserProfile, updateMemberProfile } from "../../actions/member";
import dynamic from "next/dynamic";

const MapPicker = dynamic(() => import("../../../components/MapPicker"), { ssr: false });

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo",
  "Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa",
  "Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba",
  "Yobe","Zamfara"
];

export default function MemberProfilePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user as any;
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState({
    fullName: user?.name || "Corp Member",
    email: user?.email || "",
    phone: "",
    batch: "",
  });
  const [ppa, setPpa] = useState({
    ppaState: "",
    ppaLga: "",
    ppaLatitude: null as number | null,
    ppaLongitude: null as number | null,
  });
  const [tempProfile, setTempProfile] = useState(profile);
  const [tempPpa, setTempPpa] = useState(ppa);
  const [isPpaEditing, setIsPpaEditing] = useState(false);
  const [isPpaSaving, setIsPpaSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (!user?.id) return;
      try {
        const data = await getUserProfile(user.id);
        if (data) {
          const p = {
            fullName: data.name || user?.name || "Corp Member",
            email: data.email || user?.email || "",
            phone: data.phone || "",
            batch: data.batch || "",
          };
          setProfile(p);
          setTempProfile(p);
          const pp = {
            ppaState: data.ppaState || "",
            ppaLga: data.ppaLga || "",
            ppaLatitude: data.ppaLatitude || null,
            ppaLongitude: data.ppaLongitude || null,
          };
          setPpa(pp);
          setTempPpa(pp);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadProfile();
  }, [user?.id]);

  const handleEditToggle = async () => {
    if (isEditing) {
      if (!tempProfile.fullName.trim()) {
        toast.error("Name is required");
        return;
      }
      setIsSaving(true);
      try {
        await updateMemberProfile(user.id, {
          name: tempProfile.fullName,
          phone: tempProfile.phone,
          batch: tempProfile.batch,
        });
        setProfile(tempProfile);
        toast.success("Profile updated successfully!");
      } catch (e) {
        toast.error("Failed to save profile.");
      } finally {
        setIsSaving(false);
        setIsEditing(false);
      }
    } else {
      setTempProfile(profile);
      setIsEditing(true);
    }
  };

  const handlePpaPositionChange = useCallback((pos: { lat: number; lng: number }) => {
    setTempPpa(prev => ({ ...prev, ppaLatitude: pos.lat, ppaLongitude: pos.lng }));
  }, []);

  const handlePpaSave = async () => {
    if (!tempPpa.ppaState || !tempPpa.ppaLga) {
      toast.error("Please enter your PPA State and Area/LGA.");
      return;
    }
    setIsPpaSaving(true);
    try {
      await updateMemberProfile(user.id, {
        ppaState: tempPpa.ppaState,
        ppaLga: tempPpa.ppaLga,
        ppaLatitude: tempPpa.ppaLatitude ?? undefined,
        ppaLongitude: tempPpa.ppaLongitude ?? undefined,
      });
      setPpa(tempPpa);
      setIsPpaEditing(false);
      toast.success("PPA location saved!");
    } catch (e) {
      toast.error("Failed to save PPA location.");
    } finally {
      setIsPpaSaving(false);
    }
  };

  const handleSignOut = () => {
    localStorage.setItem("theme", "light");
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
    signOut({ callbackUrl: "/signin" });
  };

  const hasPpa = ppa.ppaState && ppa.ppaLga;

  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your personal information and NYSC details.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Profile Sidebar */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-card p-6 rounded-2xl shadow-sm border border-border text-center">
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
              <h2 className="text-lg font-bold text-foreground">{profile.fullName}</h2>
              <p className="text-sm text-muted-foreground mb-2">{profile.email}</p>
              {hasPpa && (
                <div className="flex items-center justify-center gap-1 text-xs text-[#008A4B] font-medium mb-3">
                  <Navigation className="w-3 h-3" />
                  PPA: {ppa.ppaLga}, {ppa.ppaState}
                </div>
              )}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold">
                Verified Corper
              </div>
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
            <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
              <div className="p-6 border-b border-border flex items-center justify-between bg-secondary">
                <h3 className="text-lg font-bold text-foreground">Personal Information</h3>
                <div className="flex gap-2">
                  {isEditing && (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="text-muted-foreground hover:text-slate-700 font-medium rounded-lg">
                      Cancel
                    </Button>
                  )}
                  <Button 
                    variant={isEditing ? "default" : "outline"} 
                    size="sm" 
                    onClick={handleEditToggle}
                    disabled={isSaving}
                    className={`${isEditing ? "bg-[#008A4B] hover:bg-[#006F3C] text-white" : "bg-card text-[#008A4B] border-[#008A4B] hover:bg-green-50"} rounded-lg px-4 font-medium`}
                  >
                    {isSaving ? "Saving..." : isEditing ? "Save Changes" : "Edit Profile"}
                  </Button>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1"><User className="w-4 h-4" /> Full Name</label>
                    {isEditing ? (
                      <input type="text" value={tempProfile.fullName} onChange={(e) => setTempProfile({...tempProfile, fullName: e.target.value})} className="w-full px-3 py-2 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#008A4B]/30 focus:border-[#008A4B] transition" />
                    ) : (
                      <p className="font-medium text-foreground bg-secondary px-3 py-2 rounded-xl">{profile.fullName}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1"><Mail className="w-4 h-4" /> Email Address</label>
                    <p className="font-medium text-foreground bg-secondary px-3 py-2 rounded-xl text-sm">{profile.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1"><Phone className="w-4 h-4" /> Phone Number</label>
                    {isEditing ? (
                      <input type="tel" value={tempProfile.phone} onChange={(e) => setTempProfile({...tempProfile, phone: e.target.value})} className="w-full px-3 py-2 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#008A4B]/30 focus:border-[#008A4B] transition" placeholder="+234 800 000 0000" />
                    ) : (
                      <p className="font-medium text-foreground bg-secondary px-3 py-2 rounded-xl">{profile.phone || "Not set"}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1"><ShieldCheck className="w-4 h-4" /> Batch</label>
                    {isEditing ? (
                      <input type="text" value={tempProfile.batch} onChange={(e) => setTempProfile({...tempProfile, batch: e.target.value})} className="w-full px-3 py-2 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#008A4B]/30 focus:border-[#008A4B] transition" placeholder="e.g. Batch A 2026" />
                    ) : (
                      <p className="font-medium text-foreground bg-secondary px-3 py-2 rounded-xl">{profile.batch || "Not set"}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* PPA Location Section */}
            <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
              <div className="p-6 border-b border-border flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50">
                <div>
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-[#008A4B]" />
                    PPA Location
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Set your Place of Primary Assignment so we can show distances on properties.</p>
                </div>
                <div className="flex gap-2">
                  {isPpaEditing && (
                    <Button variant="ghost" size="sm" onClick={() => { setIsPpaEditing(false); setTempPpa(ppa); }} className="text-muted-foreground rounded-lg">Cancel</Button>
                  )}
                  <Button
                    size="sm"
                    onClick={isPpaEditing ? handlePpaSave : () => { setTempPpa(ppa); setIsPpaEditing(true); }}
                    disabled={isPpaSaving}
                    className={`${isPpaEditing ? "bg-[#008A4B] hover:bg-[#006F3C] text-white" : "bg-card text-[#008A4B] border border-[#008A4B] hover:bg-green-50"} rounded-lg px-4 font-medium text-sm`}
                  >
                    {isPpaSaving ? "Saving..." : isPpaEditing ? "Save PPA" : hasPpa ? "Update PPA" : "Set PPA"}
                  </Button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {!isPpaEditing ? (
                  hasPpa ? (
                    <div className="flex items-start gap-4 p-4 bg-green-50 rounded-xl border border-green-100">
                      <div className="w-10 h-10 rounded-full bg-[#008A4B] flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{ppa.ppaLga}</p>
                        <p className="text-sm text-muted-foreground">{ppa.ppaState} State</p>
                        {ppa.ppaLatitude && ppa.ppaLongitude && (
                          <p className="text-xs text-[#008A4B] mt-1 font-medium">
                            📍 Pin set: {ppa.ppaLatitude.toFixed(4)}, {ppa.ppaLongitude.toFixed(4)}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                        <Navigation className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="font-medium text-muted-foreground">No PPA set yet</p>
                      <p className="text-sm text-slate-400 max-w-xs">Add your PPA location to see how far each property is from your place of primary assignment.</p>
                    </div>
                  )
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">PPA State</label>
                        <select
                          value={tempPpa.ppaState}
                          onChange={(e) => setTempPpa({ ...tempPpa, ppaState: e.target.value })}
                          className="w-full px-3 py-2 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#008A4B]/30 focus:border-[#008A4B] transition bg-card"
                        >
                          <option value="">Select State</option>
                          {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">PPA Area / LGA</label>
                        <input
                          type="text"
                          value={tempPpa.ppaLga}
                          onChange={(e) => setTempPpa({ ...tempPpa, ppaLga: e.target.value })}
                          placeholder="e.g. Ikorodu, Ikeja, Yaba"
                          className="w-full px-3 py-2 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#008A4B]/30 focus:border-[#008A4B] transition"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-[#008A4B]" />
                        Pin your exact PPA location on the map{" "}
                        <span className="text-xs text-slate-400 font-normal">(click on map to drop pin)</span>
                      </label>
                      <MapPicker
                        initialPosition={tempPpa.ppaLatitude && tempPpa.ppaLongitude ? { lat: tempPpa.ppaLatitude, lng: tempPpa.ppaLongitude } : undefined}
                        onPositionChange={handlePpaPositionChange}
                      />
                      {tempPpa.ppaLatitude && (
                        <p className="text-xs text-[#008A4B] mt-2 font-medium">
                          ✅ Pin dropped at: {tempPpa.ppaLatitude.toFixed(5)}, {tempPpa.ppaLongitude?.toFixed(5)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </PageTransition>
  );
}
