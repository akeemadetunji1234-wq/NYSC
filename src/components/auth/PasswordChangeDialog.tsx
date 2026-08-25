"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { changePassword } from "../../app/actions/auth";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

const initialPasswords = { currentPassword: "", newPassword: "", confirmPassword: "" };

export function PasswordChangeDialog() {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [passwords, setPasswords] = useState(initialPasswords);

  const updatePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await changePassword(passwords);
      setPasswords(initialPasswords);
      setOpen(false);
      toast.success("Password updated. Other active sessions were signed out.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update password");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-xl">
          <KeyRound className="mr-2 h-4 w-4" /> Change Password
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            Enter your current password and a new password of at least 12 characters. Other active sessions will be signed out.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={updatePassword} className="space-y-4 py-4">
          <label className="block space-y-1.5 text-sm font-medium text-foreground">
            <span>Current password</span>
            <input
              required
              autoComplete="current-password"
              type="password"
              value={passwords.currentPassword}
              onChange={(event) => setPasswords((current) => ({ ...current, currentPassword: event.target.value }))}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-[#008A4B]/30"
            />
          </label>
          <label className="block space-y-1.5 text-sm font-medium text-foreground">
            <span>New password</span>
            <input
              required
              minLength={12}
              autoComplete="new-password"
              type="password"
              value={passwords.newPassword}
              onChange={(event) => setPasswords((current) => ({ ...current, newPassword: event.target.value }))}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-[#008A4B]/30"
            />
          </label>
          <label className="block space-y-1.5 text-sm font-medium text-foreground">
            <span>Confirm new password</span>
            <input
              required
              minLength={12}
              autoComplete="new-password"
              type="password"
              value={passwords.confirmPassword}
              onChange={(event) => setPasswords((current) => ({ ...current, confirmPassword: event.target.value }))}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-[#008A4B]/30"
            />
          </label>
          <DialogFooter>
            <Button type="submit" disabled={isSaving} className="rounded-xl bg-[#008A4B] text-white hover:bg-[#006F3C]">
              {isSaving ? "Updating…" : "Update Password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
