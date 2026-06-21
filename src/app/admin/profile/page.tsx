"use client";

import { PageTransition } from "../../../components/layout/PageTransition";
import { User, Mail, ShieldCheck, KeyRound, Smartphone, LogOut } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";

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

  const handle2FAToggle = () => {
    if (is2FAEnabled) {
      setIs2FAEnabled(false);
      toast.info("Two-Factor Authentication disabled.");
    } else {
      setIs2FAEnabled(true);
      toast.success("Two-Factor Authentication is now active!");
    }
  };

  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
          <p className="text-slate-500 mt-1">Manage your administrative account and security preferences.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Profile Sidebar */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center">
              <div className="w-24 h-24 bg-[#008A4B] rounded-full mx-auto flex items-center justify-center text-3xl font-bold text-white shadow-md mb-4 relative">
                {fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 border-2 border-white rounded-full"></div>
              </div>
              <h2 className="text-lg font-bold text-slate-900">{fullName}</h2>
              <p className="text-sm text-slate-500 mb-6">{email}</p>
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
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Personal Information</h3>
                <div className="flex gap-2">
                  {isEditing && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsEditing(false)}
                      className="text-slate-500 hover:text-slate-700 font-medium"
                    >
                      Cancel
                    </Button>
                  )}
                  <Button 
                    variant={isEditing ? "default" : "ghost"} 
                    size="sm" 
                    onClick={handleEditToggle}
                    className={`${isEditing ? "bg-[#008A4B] hover:bg-[#006F3C] text-white rounded-lg px-3" : "text-[#008A4B] hover:text-[#006F3C]"} font-medium`}
                  >
                    {isEditing ? "Save" : "Edit"}
                  </Button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-slate-500 flex items-center gap-2 mb-1">
                      <User className="w-4 h-4" /> Full Name
                    </label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={tempName} 
                        onChange={(e) => setTempName(e.target.value)} 
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#008A4B]/30 focus:border-[#008A4B]"
                      />
                    ) : (
                      <p className="font-medium text-slate-900">{fullName}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500 flex items-center gap-2 mb-1">
                      <Mail className="w-4 h-4" /> Email Address
                    </label>
                    {isEditing ? (
                      <input 
                        type="email" 
                        value={tempEmail} 
                        onChange={(e) => setTempEmail(e.target.value)} 
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#008A4B]/30 focus:border-[#008A4B]"
                      />
                    ) : (
                      <p className="font-medium text-slate-900">{email}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Security Settings</h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <KeyRound className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">Password</h4>
                      <p className="text-sm text-slate-500">Last changed 3 months ago</p>
                    </div>
                  </div>
                  
                  <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="rounded-xl cursor-pointer">Update</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-6">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-slate-900">Update Password</DialogTitle>
                        <DialogDescription className="text-sm text-slate-500 mt-1">
                          Change your administrator password below.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handlePasswordUpdate} className="space-y-4 py-4">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Password</label>
                          <input 
                            type="password" 
                            value={currentPassword} 
                            onChange={(e) => setCurrentPassword(e.target.value)} 
                            placeholder="••••••••"
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#008A4B]/30 focus:border-[#008A4B]"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">New Password</label>
                          <input 
                            type="password" 
                            value={newPassword} 
                            onChange={(e) => setNewPassword(e.target.value)} 
                            placeholder="••••••••"
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#008A4B]/30 focus:border-[#008A4B]"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Confirm New Password</label>
                          <input 
                            type="password" 
                            value={confirmPassword} 
                            onChange={(e) => setConfirmPassword(e.target.value)} 
                            placeholder="••••••••"
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#008A4B]/30 focus:border-[#008A4B]"
                          />
                        </div>
                        <DialogFooter className="pt-4 flex gap-2">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={() => setIsPasswordDialogOpen(false)}
                            className="w-full sm:w-auto text-slate-500 hover:text-slate-700"
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
                
                <div className="w-full h-px bg-slate-100"></div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <Smartphone className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">Two-Factor Authentication</h4>
                      <p className="text-sm text-slate-500">Add an extra layer of security to your account.</p>
                    </div>
                  </div>
                  <Button 
                    onClick={handle2FAToggle}
                    variant={is2FAEnabled ? "outline" : "default"}
                    className={`rounded-xl cursor-pointer ${
                      is2FAEnabled 
                        ? "border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" 
                        : "bg-[#008A4B] hover:bg-[#006F3C] text-white"
                    }`}
                  >
                    {is2FAEnabled ? "Disable" : "Enable"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

