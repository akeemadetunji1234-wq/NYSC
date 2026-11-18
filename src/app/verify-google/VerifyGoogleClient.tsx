"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { getGoogleOnboardingState, sendOtp } from "../actions/otp";
import { OtpVerification } from "../components/Auth/OtpVerification";
import { AuthTheme } from "../components/Auth/AuthTheme";

const GOOGLE_ONBOARDING_KEY = "nysc.googleOnboarding";

function readStoredOnboarding(): { token: string; role: "CORP" | "AGENT" } | null {
  try {
    const raw = sessionStorage.getItem(GOOGLE_ONBOARDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { token?: string; role?: string };
    if (!parsed.token || !/^[a-f0-9]{64}$/i.test(parsed.token)) return null;
    return { token: parsed.token, role: parsed.role === "AGENT" ? "AGENT" : "CORP" };
  } catch {
    return null;
  }
}

function rememberOnboarding(token: string, role: "CORP" | "AGENT") {
  sessionStorage.setItem(GOOGLE_ONBOARDING_KEY, JSON.stringify({ token, role }));
}

function clearOnboarding() {
  sessionStorage.removeItem(GOOGLE_ONBOARDING_KEY);
}

function VerifyGoogleContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const stateToken = searchParams.get("state") || "";
  const initialRole = searchParams.get("role") === "AGENT" ? "AGENT" : "CORP";

  const [onboardingToken, setOnboardingToken] = useState(stateToken);
  const [accountRole, setAccountRole] = useState<"CORP" | "AGENT">(initialRole);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("state") || "";
    const urlRole: "CORP" | "AGENT" = params.get("role") === "AGENT" ? "AGENT" : "CORP";
    let token = /^[a-f0-9]{64}$/i.test(urlToken) ? urlToken : "";
    let role: "CORP" | "AGENT" = urlRole;

    if (token) {
      rememberOnboarding(token, role);
    } else {
      const stored = readStoredOnboarding();
      if (!stored) {
        router.replace("/signin");
        return;
      }
      token = stored.token;
      role = stored.role;
    }

    setOnboardingToken(token);
    setAccountRole(role);
    // Stripping ?state= retriggers this effect. The token is already stored, so do not
    // treat the clean URL as a failed sign-in and do not send a second code.
    if (startedRef.current) return;
    startedRef.current = true;

    let active = true;
    const initOtp = async () => {
      try {
        const state = await getGoogleOnboardingState(token);
        if (!active) return;
        if (!state.success || !state.email) {
          setErrorMsg(state.error || "Google sign-in verification is unavailable.");
          return;
        }
        setEmail(state.email);
        setName(state.name || "");
        const res = await sendOtp(state.email);
        if (!active) return;
        if (!res.success) setErrorMsg(res.error || "Failed to send verification code.");
        if (window.location.search) {
          window.history.replaceState(null, "", "/verify-google");
        }
      } catch {
        if (active) setErrorMsg("An unexpected error occurred.");
      }
    };

    void initOtp();
    return () => {
      active = false;
    };
  }, [router, stateToken]);

  const handleSuccess = async () => {
    if (!email || !onboardingToken) {
      setErrorMsg("Google sign-in verification is unavailable. Please start again.");
      return;
    }
    setIsLoading(true);
    try {
      const generatedPassword = `${crypto.randomUUID()}Aa1!`;
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // The server ignores this display value and uses the stored Google state.
          name: name || "Google user",
          email,
          password: generatedPassword,
          role: accountRole,
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

      const signInResult = await signIn("credentials", {
        email,
        password: generatedPassword,
        role: accountRole,
        redirect: false,
        callbackUrl: accountRole === "AGENT" ? "/agent" : "/member",
      });
      if (!signInResult || signInResult.error) {
        setErrorMsg("Your account was created, but automatic sign-in failed. Please sign in manually.");
        setIsLoading(false);
        return;
      }
      router.push(accountRole === "AGENT" ? "/agent" : "/member");
      clearOnboarding();
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
            <button onClick={() => { clearOnboarding(); router.push("/signin"); }} className="mt-4 block w-full rounded-lg bg-[#008A4B] py-2 text-white">
              Back to Sign In
            </button>
          </div>
        ) : (
          <OtpVerification email={email} onSuccess={handleSuccess} onCancel={() => { clearOnboarding(); router.push("/signin"); }} />
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
