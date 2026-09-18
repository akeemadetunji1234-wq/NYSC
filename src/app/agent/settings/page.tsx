"use client";

import { PageTransition } from "../../../components/layout/PageTransition";
import { User, Building, Bell, Shield, MapPin, Save, Phone, KeyRound } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { updateMemberProfile } from "../../actions/member";
import { getAgentProfile, updateAgentLogo } from "../../actions/agent";
import { PasswordChangeDialog } from "../../../components/auth/PasswordChangeDialog";

export default function AgentSettingsPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  const [activeTab, setActiveTab] = useState("business");
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    whatsapp: "",
    whatsappOptIn: false,
    agency: "",
    experience: "",
    bio: "",
    operatingStates: [] as string[],
    image: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (!userId) return;
      try {
        const data = await getAgentProfile();
        if (data) {
          setProfile({
            name: data.name || "",
            email: data.email || "",
            phone: data.phone || "",
            whatsapp: data.whatsapp || "",
            whatsappOptIn: Boolean(data.whatsappOptIn),
            agency: data.agency || "",
            experience: data.experience || "",
            bio: data.bio || "",
            operatingStates: data.operatingStates || [],
            image: data.image || "",
          });
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    }
    loadProfile();
  }, [userId]);

  const handleSave = async () => {
    if (!userId) {
      toast.error("You must be logged in to save settings.");
      return;
    }
    setIsSaving(true);
    try {
      await updateMemberProfile({
        name: profile.name,
        phone: profile.phone,
        whatsapp: profile.whatsapp,
        whatsappOptIn: profile.whatsappOptIn,
        agency: profile.agency,
        experience: profile.experience,
        bio: profile.bio,
        operatingStates: profile.operatingStates,
      });
      toast.success("Settings saved successfully!");
    } catch (err) {
      toast.error("Failed to save settings.");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      toast.error("Choose a JPG, PNG, or WebP logo up to 5MB.");
      return;
    }
    const body = new FormData();
    body.append("file", file);
    body.append("purpose", "agent-logo");
    try {
      const response = await fetch("/api/upload/cloudinary", { method: "POST", body });
      const result = await response.json();
      if (!response.ok || !result.secureUrl) throw new Error(result.error || "Upload failed");
      await updateAgentLogo(result.secureUrl);
      setProfile((current) => ({ ...current, image: result.secureUrl }));
      toast.success("Logo uploaded successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Logo upload failed.");
    }
  };

  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Agent Settings</h1>
            <p className="text-muted-foreground mt-1">Manage your business profile, contact details, and preferences.</p>
          </div>
          {activeTab === "business" && (
            <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 rounded-xl">
              <Save className="w-4 h-4" /> {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Settings Navigation */}
          <div className="md:col-span-1 flex overflow-x-auto md:flex-col gap-2 md:gap-0 md:space-y-1 pb-2 md:pb-0 scrollbar-hide">
            <button 
              onClick={() => setActiveTab('business')}
              className={`whitespace-nowrap flex-shrink-0 md:w-full flex items-center gap-3 px-4 py-3 font-medium rounded-xl transition ${activeTab === 'business' ? 'bg-card text-blue-600 shadow-sm border border-border' : 'text-muted-foreground hover:bg-secondary'}`}
            >
              <Building className={`w-5 h-5 shrink-0 ${activeTab === 'business' ? '' : 'text-slate-400'}`} /> Business Profile
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`whitespace-nowrap flex-shrink-0 md:w-full flex items-center gap-3 px-4 py-3 font-medium rounded-xl transition ${activeTab === 'security' ? 'bg-card text-blue-600 shadow-sm border border-border' : 'text-muted-foreground hover:bg-secondary'}`}
            >
              <KeyRound className={`w-5 h-5 shrink-0 ${activeTab === 'security' ? '' : 'text-slate-400'}`} /> Security
            </button>

          </div>

          {/* Settings Content */}
          <div className="md:col-span-3 space-y-6">
            {activeTab === 'business' && (
              <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden animate-in fade-in duration-300">
                <div className="p-6 border-b border-border">
                  <h2 className="text-lg font-bold text-foreground">Business Profile</h2>
                  <p className="text-sm text-muted-foreground mt-1">Information displayed to members on your property listings.</p>
                </div>
                <div className="p-6 space-y-6">
                  <div className="flex items-center gap-6">
                     <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center border-2 border-dashed border-slate-300 text-slate-400 overflow-hidden">
                        {profile.image ? <img src={profile.image} alt="Agency logo" className="h-full w-full object-cover" /> : <User className="w-8 h-8" />}
                     </div>
                     <label className="inline-flex cursor-pointer items-center rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"><input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleLogoUpload} />Upload Logo</label>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                      <label className="text-sm font-medium text-muted-foreground">Business/Agency Name</label>
                      <input 
                        type="text" 
                        value={profile.name} 
                        onChange={e => setProfile({ ...profile, name: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition bg-card" 
                      />
                    </div>
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                      <label className="text-sm font-medium text-muted-foreground">Contact Email</label>
                      <input 
                        type="email" 
                        value={profile.email} 
                        disabled
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-secondary text-muted-foreground cursor-not-allowed" 
                      />
                    </div>
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                      <label className="text-sm font-medium text-muted-foreground">Mobile Phone Number</label>
                      <input 
                        type="tel" 
                        value={profile.phone} 
                        onChange={e => setProfile({ ...profile, phone: e.target.value })}
                        placeholder="e.g. +234 812 345 6789"
                        className="w-full px-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition bg-card" 
                      />
                    </div>
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <Phone className="w-4 h-4 text-[#25D366]" /> WhatsApp Number
                      </label>
                      <input 
                        type="tel" 
                        value={profile.whatsapp} 
                        onChange={e => setProfile({ ...profile, whatsapp: e.target.value })}
                        placeholder="e.g. +234 803 123 4567"
                        className="w-full px-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition bg-card" 
                      />
                    </div>
                    <label className="col-span-2 flex items-start gap-3 rounded-xl border border-border bg-secondary/30 p-4 text-sm"><input type="checkbox" checked={profile.whatsappOptIn} onChange={e => setProfile({ ...profile, whatsappOptIn: e.target.checked })} className="mt-1 h-4 w-4 accent-[#008A4B]" /><span><span className="font-semibold text-foreground">Send viewing reminders on WhatsApp</span><span className="mt-1 block text-xs text-muted-foreground">I consent to NYSC sending approved viewing reminder templates to the WhatsApp number above. You can switch this off at any time.</span></span></label>
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                      <label className="text-sm font-medium text-muted-foreground">Agency Name</label>
                      <input 
                        type="text" 
                        value={profile.agency} 
                        onChange={e => setProfile({ ...profile, agency: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition bg-card" 
                      />
                    </div>
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                      <label className="text-sm font-medium text-muted-foreground">Years of Experience</label>
                      <input 
                        type="text" 
                        value={profile.experience} 
                        onChange={e => setProfile({ ...profile, experience: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition bg-card" 
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <label className="text-sm font-medium text-muted-foreground">Bio / About</label>
                      <textarea 
                        value={profile.bio} 
                        onChange={e => setProfile({ ...profile, bio: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition bg-card" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden animate-in fade-in duration-300">
                <div className="p-6 border-b border-border">
                  <h2 className="text-lg font-bold text-foreground">Security Settings</h2>
                  <p className="text-sm text-muted-foreground mt-1">Update your password and revoke other active sessions.</p>
                </div>
                <div className="p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-foreground">Password</p>
                    <p className="text-sm text-muted-foreground">Use your current password to set a new one.</p>
                  </div>
                  <PasswordChangeDialog />
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </PageTransition>
  );
}
