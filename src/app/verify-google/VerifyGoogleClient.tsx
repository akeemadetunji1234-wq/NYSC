"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { getGoogleOnboardingState, sendOtp } from "../actions/otp";
import { OtpVerification } from "../components/Auth/OtpVerification";
import { AuthTheme } from "../components/Auth/AuthTheme";

function VerifyGoogleContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const stateToken = searchParams.get("state") || "";

  const [onboardingToken, setOnboardingToken] = useState(stateToken);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!stateToken) {
      router.replace("/signin");
      return;
    }

    let cancelled = false;
    const initOtp = async () => {
      try {
        const state = await getGoogleOnboardingState(stateToken);
        if (cancelled) return;
        if (!state.success || !state.email) {
          setErrorMsg(state.error || "Google sign-in verification is unavailable.");
          return;
        }
        setEmail(state.email);
        setName(state.name || "");
        // The opaque state stays only in memory for the one registration POST.
        window.history.replaceState(null, "", "/verify-google");
        const res = await sendOtp(state.email);
        if (!res.success) setErrorMsg(res.error || "Failed to send verification code.");
      } catch {
        if (!cancelled) setErrorMsg("An unexpected error occurred.");
      }
    };

    void initOtp();
    return () => {
      cancelled = true;
    };
  }, [router, stateToken]);

  const handleSuccess = async () => {
    if (!email || !onboardingToken) {
      setErrorMsg("Google sign-in verification is unavailable. Please start again.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // The server ignores this display value and uses the stored Google state.
          name: name || "Google user",
          email,
          password: `${crypto.randomUUID()}Aa1!`,
          role: "CORP",
          phone: null,
          googleOnboardingState: onboardingToken,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.message || "Registration failed.");
        setIsLoading(false);
        return;
      }

      await signIn("google", { callbackUrl: "/" });
    } catch {
      setErrorMsg("An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 text-gray-900">
        {errorMsg ? <p className="rounded-lg bg-red-50 p-4 text-red-600">{errorMsg}</p> : <p>Verifying Google sign-in…</p>}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-xl">
        {errorMsg ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-red-600">
            {errorMsg}
            <button onClick={() => router.push("/signin")} className="mt-4 block w-full rounded-lg bg-[#008A4B] py-2 text-white">
              Back to Sign In
            </button>
          </div>
        ) : (
          <OtpVerification email={email} onSuccess={handleSuccess} onCancel={() => router.push("/signin")} />
        )}
        {isLoading && <p className="mt-4 text-center text-sm text-gray-500">Creating your account…</p>}
      </div>
    </div>
  );
}

export default function VerifyGoogle() {
  return (
    <AuthTheme>
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-900">Loading...</div>}>
        <VerifyGoogleContent />
      </Suspense>
    </AuthTheme>
  );
}
