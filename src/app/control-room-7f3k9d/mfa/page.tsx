"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageTransition } from "../../../components/layout/PageTransition";
import { Button } from "../../../components/ui/button";
import { toast } from "sonner";
import { ShieldCheck, KeyRound, Loader2 } from "lucide-react";
import {
  beginAdminMfaEnrollment,
  confirmAdminMfaEnrollment,
  verifyAdminMfaStepUp,
  disableAdminMfa,
  getMyAdminMfaStatus,
} from "../../actions/adminMfa";

export default function AdminMfaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/control-room-7f3k9d";

  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [steppedUp, setSteppedUp] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const status = await getMyAdminMfaStatus();
    setEnabled(status.enabled);
    setSteppedUp(status.steppedUp);
    return status;
  };

  useEffect(() => {
    refresh()
      .catch(() => toast.error("Unable to load MFA status"))
      .finally(() => setLoading(false));
  }, []);

  const startEnroll = async () => {
    setBusy(true);
    try {
      const res = await beginAdminMfaEnrollment();
      setSecret(res.secret);
      setOtpauthUrl(res.otpauthUrl);
      toast.message("Add the secret in your authenticator app, then enter a code.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Enrollment failed");
    } finally {
      setBusy(false);
    }
  };

  const confirmEnroll = async () => {
    setBusy(true);
    try {
      await confirmAdminMfaEnrollment(code);
      setCode("");
      setSecret(null);
      setOtpauthUrl(null);
      toast.success("MFA enabled");
      await refresh();
      router.replace(nextPath.startsWith("/") ? nextPath : "/control-room-7f3k9d");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Invalid code");
    } finally {
      setBusy(false);
    }
  };

  const stepUp = async () => {
    setBusy(true);
    try {
      await verifyAdminMfaStepUp(code);
      setCode("");
      toast.success("Verified for 15 minutes");
      await refresh();
      router.replace(nextPath.startsWith("/") ? nextPath : "/control-room-7f3k9d");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Invalid code");
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      await disableAdminMfa(code);
      setCode("");
      toast.success("MFA disabled");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not disable MFA");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading MFA…
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-lg space-y-6 p-4 md:p-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Administrator MFA</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Protect sensitive actions with a time-based code from Google Authenticator, Authy, or 1Password.
          </p>
        </div>

        <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className={`h-5 w-5 ${enabled ? "text-emerald-600" : "text-muted-foreground"}`} />
            <span className="font-semibold text-foreground">
              {enabled ? "MFA is enabled" : "MFA is not enabled yet"}
            </span>
          </div>
          {enabled && (
            <p className="text-sm text-muted-foreground">
              Step-up status: {steppedUp ? "verified (valid ~15 min)" : "required before sensitive actions"}
            </p>
          )}

          {!enabled && !secret && (
            <Button
              disabled={busy}
              onClick={startEnroll}
              className="rounded-xl bg-[#008A4B] text-white hover:bg-[#006F3C]"
            >
              <KeyRound className="mr-2 h-4 w-4" /> Start MFA enrollment
            </Button>
          )}

          {secret && (
            <div className="space-y-3 rounded-xl border border-dashed border-border bg-secondary/40 p-4">
              <p className="text-sm font-medium text-foreground">Add this account in your authenticator app</p>
              <p className="break-all font-mono text-xs text-muted-foreground">{secret}</p>
              {otpauthUrl && (
                <a className="text-xs font-semibold text-[#008A4B] underline" href={otpauthUrl}>
                  Open otpauth link
                </a>
              )}
              <p className="text-xs text-muted-foreground">
                Paste the secret into your authenticator app (QR omitted for CSP simplicity).
              </p>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground" htmlFor="totp">
              6-digit code
            </label>
            <input
              id="totp"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-center text-lg tracking-widest text-foreground"
              placeholder="000000"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {!enabled && secret && (
              <Button
                disabled={busy || code.length !== 6}
                onClick={confirmEnroll}
                className="rounded-xl bg-[#008A4B] text-white"
              >
                Confirm & enable
              </Button>
            )}
            {enabled && (
              <Button
                disabled={busy || code.length !== 6}
                onClick={stepUp}
                className="rounded-xl bg-[#008A4B] text-white"
              >
                Verify step-up
              </Button>
            )}
            {enabled && (
              <Button
                disabled={busy || code.length !== 6}
                variant="outline"
                onClick={disable}
                className="rounded-xl border-red-200 text-red-600"
              >
                Disable MFA
              </Button>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
