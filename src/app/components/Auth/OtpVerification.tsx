"use client";

import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Mail, ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { sendOtp, verifyOtp } from "../../actions/otp";
import { Button } from "../ui/button";

interface OtpVerificationProps {
  email: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function OtpVerification({ email, onSuccess, onCancel }: OtpVerificationProps) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Resend Cooldown
  const [cooldown, setCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pastedCode = value.slice(0, 6).split("");
      const newCode = [...code];
      pastedCode.forEach((char, i) => {
        if (index + i < 6) newCode[index + i] = char;
      });
      setCode(newCode);
      const nextFocus = Math.min(index + pastedCode.length, 5);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-advance
    if (value !== "" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && code[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join("");
    if (fullCode.length < 6) {
      setErrorMsg("Please enter the complete 6-digit code.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const res = await verifyOtp(email, fullCode);
    if (!res.success) {
      setErrorMsg(res.error || "Invalid code.");
      toast.error(res.error || "Verification failed");
      setIsLoading(false);
      return;
    }

    toast.success("Email verified successfully!");
    setIsLoading(false);
    onSuccess();
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    setErrorMsg(null);

    const res = await sendOtp(email);
    if (!res.success) {
      setErrorMsg(res.error || "Failed to resend code.");
      toast.error(res.error || "Failed to resend code.");
    } else {
      toast.success("A new verification code has been sent.");
      setCooldown(60);
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
    setIsResending(false);
  };

  return (
    <div className="w-full max-w-sm mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-4">
          <Mail className="w-6 h-6 text-[#008A4B]" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Verify your email</h2>
        <p className="text-sm text-gray-500">
          We sent a 6-digit code to <span className="font-medium text-gray-900">{email}</span>
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium text-center">
          {errorMsg}
        </div>
      )}

      <div className="flex justify-center gap-2">
        {code.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => { inputRefs.current[idx] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={digit}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            className="w-12 h-14 text-center text-2xl font-bold rounded-xl border border-gray-300 focus:border-[#008A4B] focus:ring-1 focus:ring-[#008A4B] outline-none transition"
          />
        ))}
      </div>

      <Button
        onClick={handleVerify}
        disabled={isLoading || code.join("").length < 6}
        className="w-full py-6 bg-[#008A4B] hover:bg-green-700 text-white rounded-xl font-bold shadow-md shadow-green-900/20"
      >
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Account"}
      </Button>

      <div className="flex flex-col items-center justify-center gap-4 text-sm mt-4">
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || isResending}
          className="flex items-center gap-1.5 text-[#008A4B] hover:text-green-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isResending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-900 underline underline-offset-4"
        >
          Change email address
        </button>
      </div>
    </div>
  );
}
