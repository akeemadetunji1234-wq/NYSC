"use client";


import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { sendOtp } from "../actions/otp";
import { OtpVerification } from "../components/Auth/OtpVerification";
import { AuthTheme } from "../components/Auth/AuthTheme";

function VerifyGoogleContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const email = searchParams.get("email");
  const name = searchParams.get("name");
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      router.push("/signin");
      return;
    }

    const initOtp = async () => {
      try {
        const res = await sendOtp(email);
        if (!res.success) {
          setErrorMsg(res.error || "Failed to send verification code.");
        }
      } catch (err) {
        setErrorMsg("An unexpected error occurred while sending OTP.");
      }
    };
    
    initOtp();
  }, [email, router]);

  const handleSuccess = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || "New User",
          email: email,
          password: `${crypto.randomUUID()}Aa1!`,
          role: "CORP",
          phone: null,
        })
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.message || "Registration failed.");
        setIsLoading(false);
        return;
      }

      // Automatically sign in via Google now that the user exists
      await signIn("google", { callbackUrl: "/" });
    } catch (err) {
      setErrorMsg("An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  if (!email) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-xl">
        {errorMsg ? (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-4 text-center">
            {errorMsg}
            <button 
              onClick={() => router.push("/signin")}
              className="mt-4 block w-full bg-[#008A4B] text-white py-2 rounded-lg"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <OtpVerification
            email={email}
            onSuccess={handleSuccess}
            onCancel={() => router.push("/signin")}
          />
        )}
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
