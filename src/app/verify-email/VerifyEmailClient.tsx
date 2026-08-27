"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { verifyEmailToken } from "../actions/otp";

export default function VerifyEmailClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email securely…");

  useEffect(() => {
    let cancelled = false;
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("This verification link is invalid or incomplete.");
      return;
    }

    void verifyEmailToken(token).then((result) => {
      if (cancelled) return;
      if (!result.success || !result.email) {
        setStatus("error");
        setMessage(result.error || "This verification link is invalid or expired.");
        return;
      }

      setStatus("success");
      setMessage("Your email has been verified. Continue signup to finish creating your account.");
      // Remove the one-time token from the address bar and browser history. The
      // signup page still performs its own server-side EmailOtp check.
      router.replace(`/signup?email=${encodeURIComponent(result.email)}&verified=1`);
    });

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <main className="min-h-screen bg-white px-6 py-16 text-gray-900">
      <section className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-xl">
        {status === "loading" && <Loader2 className="mb-5 h-12 w-12 animate-spin text-[#008A4B]" aria-hidden="true" />}
        {status === "success" && <CheckCircle2 className="mb-5 h-14 w-14 text-[#008A4B]" aria-hidden="true" />}
        {status === "error" && <XCircle className="mb-5 h-14 w-14 text-red-600" aria-hidden="true" />}
        <h1 className="text-2xl font-bold">{status === "success" ? "Email verified" : status === "error" ? "Verification unavailable" : "Verify your email"}</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">{message}</p>
        {status !== "loading" && (
          <Link href="/signup" className="mt-7 inline-flex rounded-xl bg-[#008A4B] px-5 py-3 font-semibold text-white shadow-lg transition hover:bg-[#006F3C]">
            Continue to signup
          </Link>
        )}
      </section>
    </main>
  );
}
