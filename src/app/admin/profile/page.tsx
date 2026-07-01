"use client";

import { PageTransition } from "../../../components/layout/PageTransition";
import { User, Mail, ShieldCheck, KeyRound, Smartphone, LogOut, CheckCircle2 } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog";

export default function ProfilePage() {
  const router = useRouter();
  
  // Profile information states
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState("Super Admin");
  const [email, setEmail] = useState("admin@campstay.ng");
  
  // Temporary states for edit inputs
  const [tempName, setTempName] = useState(fullName);
  const [tempEmail, setTempEmail] = useState(email);

  // Security states
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [is2FADialogOpen, setIs2FADialogOpen] = useState(false);
  const [twoFAStep, setTwoFAStep] = useState(1);
  const [twoFACode, setTwoFACode] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved2FA = localStorage.getItem("admin_2fa_enabled");
      if (saved2FA === "true") {
        setIs2FAEnabled(true);
      }
    }
  }, []);
  
  // Password inputs
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleEditToggle = () => {
    if (isEditing) {
      // Validate
      if (!tempName.trim()) {
        toast.error("Name cannot be empty");
        return;
      }
      if (!tempEmail.trim() || !tempEmail.includes("@")) {
        toast.error("Please enter a valid email address");
        return;
      }
      setFullName(tempName);
      setEmail(tempEmail);
      setIsEditing(false);
      toast.success("Personal information updated successfully!");
    } else {
      setTempName(fullName);
      setTempEmail(email);
      setIsEditing(true);
    }
  };

  const handleSignOut = () => {
    const toastId = toast.loading("Signing out...");
    setTimeout(() => {
      toast.dismiss(toastId);
      router.push("/signin");
    }, 1200);
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All password fields are required");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long");
      return;
    }
    
    const toastId = toast.loading("Updating password...");
    setTimeout(() => {
      toast.success("Password has been successfully updated!", { id: toastId });
      setIsPasswordDialogOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }, 1500);
  };

  const handleVerify2FA = () => {
    if (twoFACode.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }
    
    const toastId = toast.loading("Verifying code...");
    setTimeout(() => {
      toast.success("Two-Factor Authentication is now active!", { id: toastId });
      setIs2FAEnabled(true);
      localStorage.setItem("admin_2fa_enabled", "true");
      setIs2FADialogOpen(false);
      setTwoFAStep(1);
      setTwoFACode("");
    }, 1500);
  };

  const handleDisable2FA = () => {
    setIs2FAEnabled(false);
    localStorage.removeItem("admin_2fa_enabled");
    toast.info("Two-Factor Authentication has been disabled.");
  };

  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your administrative account and security preferences.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Profile Sidebar */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-card p-6 rounded-2xl shadow-sm border border-border text-center">
              <div className="w-24 h-24 bg-[#008A4B] rounded-full mx-auto flex items-center justify-center text-3xl font-bold text-white shadow-md mb-4 relative">
                {fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 border-2 border-white rounded-full"></div>
              </div>
              <h2 className="text-lg font-bold text-foreground">{fullName}</h2>
              <p className="text-sm text-muted-foreground mb-6">{email}</p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" /> Full Access
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
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Personal Information</h3>
                  <p className="text-sm text-muted-foreground mt-1">Update your name and email address.</p>
                </div>
                <div className="flex gap-2">
                  {isEditing && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsEditing(false)}
                      className="text-muted-foreground hover:text-slate-700 font-medium rounded-xl"
                    >
                      Cancel
                    </Button>
                  )}
                  <Button 
                    variant={isEditing ? "default" : "outline"} 
                    size="sm" 
                    onClick={handleEditToggle}
                    className={`${isEditing ? "bg-[#008A4B] hover:bg-[#006F3C] text-white" : "border-border text-muted-foreground hover:bg-secondary"} font-medium rounded-xl px-4`}
                  >
                    {isEditing ? "Save Changes" : "Edit Details"}
                  </Button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
                      <User className="w-4 h-4" /> Full Name
                    </label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={tempName} 
                        onChange={(e) => setTempName(e.target.value)} 
                        className="w-full px-3 py-2 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#008A4B]/30 focus:border-[#008A4B]"
                      />
                    ) : (
                      <p className="font-medium text-foreground px-3 py-2 bg-secondary rounded-xl">{fullName}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
                      <Mail className="w-4 h-4" /> Email Address
                    </label>
                    {isEditing ? (
                      <input 
                        type="email" 
                        value={tempEmail} 
                        onChange={(e) => setTempEmail(e.target.value)} 
                        className="w-full px-3 py-2 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#008A4B]/30 focus:border-[#008A4B]"
                      />
                    ) : (
                      <p className="font-medium text-foreground px-3 py-2 bg-secondary rounded-xl">{email}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-bold text-foreground">Security Settings</h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-secondary rounded-lg shrink-0">
                      <KeyRound className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Password</h4>
                      <p className="text-sm text-muted-foreground">Last changed 3 months ago</p>
                    </div>
                  </div>
                  
                  <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="rounded-xl cursor-pointer">Update</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-card border border-border rounded-2xl shadow-xl z-50 p-6">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-foreground">Update Password</DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground mt-1">
                          Change your administrator password below.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handlePasswordUpdate} className="space-y-4 py-4">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Password</label>
                          <input 
                            type="password" 
                            value={currentPassword} 
                            onChange={(e) => setCurrentPassword(e.target.value)} 
                            placeholder="••••••••"
                            className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#008A4B]/30 focus:border-[#008A4B]"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">New Password</label>
                          <input 
                            type="password" 
                            value={newPassword} 
                            onChange={(e) => setNewPassword(e.target.value)} 
                            placeholder="••••••••"
                            className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#008A4B]/30 focus:border-[#008A4B]"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Confirm New Password</label>
                          <input 
                            type="password" 
                            value={confirmPassword} 
                            onChange={(e) => setConfirmPassword(e.target.value)} 
                            placeholder="••••••••"
                            className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#008A4B]/30 focus:border-[#008A4B]"
                          />
                        </div>
                        <DialogFooter className="pt-4 flex gap-2">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={() => setIsPasswordDialogOpen(false)}
                            className="w-full sm:w-auto text-muted-foreground hover:text-slate-700"
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            className="w-full sm:w-auto bg-[#008A4B] hover:bg-[#006F3C] text-white rounded-xl"
                          >
                            Save Changes
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="w-full h-px bg-secondary"></div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-secondary rounded-lg shrink-0">
                      <Smartphone className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground flex items-center gap-2">
                        Two-Factor Authentication
                        {is2FAEnabled && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                         {is2FAEnabled ? "Your account is secured with 2FA." : "Add an extra layer of security to your account."}
                      </p>
                    </div>
                  </div>
                  
                  {is2FAEnabled ? (
                    <Button 
                      onClick={handleDisable2FA}
                      variant="outline"
                      className="rounded-xl cursor-pointer border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      Disable
                    </Button>
                  ) : (
                    <Dialog open={is2FADialogOpen} onOpenChange={(open) => {
                       setIs2FADialogOpen(open);
                       if (!open) setTwoFAStep(1);
                    }}>
                      <DialogTrigger asChild>
                        <Button className="rounded-xl cursor-pointer bg-[#008A4B] hover:bg-[#006F3C] text-white">
                          Enable
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md bg-card border border-border rounded-2xl shadow-xl z-50 p-6">
                        <DialogHeader>
                          <DialogTitle className="text-xl font-bold text-foreground">Set Up Two-Factor Authentication</DialogTitle>
                        </DialogHeader>
                        
                        {twoFAStep === 1 ? (
                          <div className="space-y-6 py-4 text-center">
                            <p className="text-sm text-muted-foreground">Scan this QR code with your authenticator app (e.g., Google Authenticator, Authy).</p>
                            
                            <div className="w-48 h-48 mx-auto bg-secondary border-2 border-border rounded-xl flex items-center justify-center relative overflow-hidden">
                               {/* Mock QR Code Pattern */}
                               <div className="absolute inset-4 grid grid-cols-6 grid-rows-6 gap-1 opacity-60">
                                 {Array.from({length: 36}).map((_, i) => (
                                    <div key={i} className={`rounded-sm ${Math.random() > 0.4 ? 'bg-slate-800' : 'bg-transparent'}`}></div>
                                 ))}
                               </div>
                               {/* Position markers */}
                               <div className="absolute top-4 left-4 w-10 h-10 border-4 border-slate-800 rounded-sm"></div>
                               <div className="absolute top-4 right-4 w-10 h-10 border-4 border-slate-800 rounded-sm"></div>
                               <div className="absolute bottom-4 left-4 w-10 h-10 border-4 border-slate-800 rounded-sm"></div>
                            </div>
                            
                            <div className="bg-secondary p-3 rounded-lg text-sm font-mono text-muted-foreground">
                               JBSWY3DPEHPK3PXP
                            </div>
                            
                            <Button onClick={() => setTwoFAStep(2)} className="w-full bg-[#008A4B] hover:bg-[#006F3C] text-white rounded-xl">
                              I have scanned the code
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-6 py-4">
                            <p className="text-sm text-muted-foreground">Enter the 6-digit code generated by your authenticator app.</p>
                            
                            <div className="space-y-2">
                               <input 
                                 type="text" 
                                 maxLength={6}
                                 value={twoFACode}
                                 onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ''))}
                                 placeholder="000000"
                                 className="w-full text-center tracking-[1em] font-mono text-2xl py-4 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008A4B]/30 focus:border-[#008A4B]"
                               />
                            </div>
                            
                            <div className="flex gap-2">
                              <Button variant="ghost" onClick={() => setTwoFAStep(1)} className="w-full">Back</Button>
                              <Button onClick={handleVerify2FA} className="w-full bg-[#008A4B] hover:bg-[#006F3C] text-white rounded-xl">Verify & Enable</Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
