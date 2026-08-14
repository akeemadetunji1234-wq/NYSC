"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { PageTransition } from "../../../components/layout/PageTransition";
import { User, Mail, ShieldCheck, KeyRound, LogOut } from "lucide-react";
import { Button } from "../../../components/ui/button";
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
import { changeAdminPassword, getAdminProfile, updateAdminProfile } from "../../actions/admin-profile";

export default function ProfilePage() {
  const [profile, setProfile] = useState({ name: "", email: "" });
  const [draft, setDraft] = useState({ name: "", email: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  useEffect(() => {
    getAdminProfile()
      .then((data) => {
        const next = { name: data.name || "", email: data.email || "" };
        setProfile(next);
        setDraft(next);
      })
      .catch(() => toast.error("Unable to load your profile"))
      .finally(() => setIsLoading(false));
  }, []);

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      const updated = await updateAdminProfile(draft);
      const next = { name: updated.name || "", email: updated.email || "" };
      setProfile(next);
      setDraft(next);
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const updatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await changeAdminPassword(passwords);
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setIsPasswordDialogOpen(false);
      toast.success("Password updated. Other active sessions were signed out.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update password");
    } finally {
      setIsSaving(false);
    }
  };

  const initials = profile.name.split(" ").filter(Boolean).map((part) => part[0]).join("").toUpperCase().slice(0, 2) || "AD";

  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl space-y-8 p-4 md:p-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
          <p className="mt-1 text-muted-foreground">Manage your administrator account and security preferences.</p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="space-y-6 md:col-span-1">
            <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-[#008A4B] text-3xl font-bold text-white shadow-md">
                {initials}
              </div>
              <h2 className="text-lg font-bold text-foreground">{isLoading ? "Loading…" : profile.name || "Administrator"}</h2>
              <p className="mb-6 text-sm text-muted-foreground">{profile.email}</p>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" /> Full Access
              </div>
            </div>
            <Button onClick={() => signOut({ callbackUrl: "/signin" })} variant="outline" className="w-full rounded-xl border-red-200 py-5 font-medium text-red-600 hover:bg-red-50">
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </div>

          <div className="space-y-6 md:col-span-2">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="flex items-center justify-between border-b border-border p-6">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Personal Information</h3>
                  <p className="mt-1 text-sm text-muted-foreground">These details are saved to your administrator account.</p>
                </div>
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => { setDraft(profile); setIsEditing(false); }}>Cancel</Button>
                    <Button size="sm" disabled={isSaving} onClick={saveProfile} className="rounded-xl bg-[#008A4B] text-white hover:bg-[#006F3C]">{isSaving ? "Saving…" : "Save Changes"}</Button>
                  </div>
                ) : <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="rounded-xl">Edit Details</Button>}
              </div>
              <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2">
                <label className="text-sm font-medium text-muted-foreground"><span className="mb-1 flex items-center gap-2"><User className="h-4 w-4" /> Full Name</span><input disabled={!isEditing} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="w-full rounded-xl border border-border bg-secondary px-3 py-2 text-sm text-foreground disabled:opacity-70" /></label>
                <label className="text-sm font-medium text-muted-foreground"><span className="mb-1 flex items-center gap-2"><Mail className="h-4 w-4" /> Email Address</span><input disabled={!isEditing} type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} className="w-full rounded-xl border border-border bg-secondary px-3 py-2 text-sm text-foreground disabled:opacity-70" /></label>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="border-b border-border p-6"><h3 className="text-lg font-bold text-foreground">Security Settings</h3></div>
              <div className="space-y-6 p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3"><div className="rounded-lg bg-secondary p-2"><KeyRound className="h-5 w-5 text-muted-foreground" /></div><div><h4 className="font-medium text-foreground">Password</h4><p className="text-sm text-muted-foreground">Change it here and revoke existing sessions.</p></div></div>
                  <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}><DialogTrigger asChild><Button variant="outline" className="rounded-xl">Update</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Update Password</DialogTitle><DialogDescription>Enter your current password and a new password of at least 12 characters.</DialogDescription></DialogHeader><form onSubmit={updatePassword} className="space-y-4 py-4"><input required type="password" placeholder="Current password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} className="w-full rounded-xl border border-border px-3 py-2" /><input required minLength={12} type="password" placeholder="New password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} className="w-full rounded-xl border border-border px-3 py-2" /><input required minLength={12} type="password" placeholder="Confirm new password" value={passwords.confirmPassword} onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} className="w-full rounded-xl border border-border px-3 py-2" /><DialogFooter><Button type="submit" disabled={isSaving} className="rounded-xl bg-[#008A4B] text-white hover:bg-[#006F3C]">{isSaving ? "Updating…" : "Update Password"}</Button></DialogFooter></form></DialogContent></Dialog>
                </div>
                <div className="h-px w-full bg-secondary" />
                <div className="flex items-start gap-3"><div className="rounded-lg bg-secondary p-2"><ShieldCheck className="h-5 w-5 text-muted-foreground" /></div><div><h4 className="font-medium text-foreground">Two-Factor Authentication</h4><p className="text-sm text-muted-foreground">Authenticator-based 2FA is not enabled in this release. This page no longer presents a fake QR code or localStorage-only security state.</p></div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
