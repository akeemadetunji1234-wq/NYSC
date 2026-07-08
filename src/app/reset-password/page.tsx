"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { resetPassword } from "../actions/auth";
import { motion } from "motion/react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  if (!token) {
    return (
      <div className="text-center">
        <div className="p-3 text-sm rounded-lg font-medium bg-red-50 text-red-700 border border-red-200">
          Invalid or missing reset token. Please request a new password reset link.
        </div>
        <div className="mt-6">
          <Link href="/forgot-password" className="inline-flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-[#008A4B] transition-colors">
            <ArrowLeft className="w-4 h-4" /> Go to Forgot Password
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters." });
      setIsLoading(false);
      return;
    }

    const res = await resetPassword(token, password);
    if (res.success) {
      setMessage({ type: "success", text: "Your password has been successfully reset. Redirecting..." });
      setTimeout(() => {
        router.push("/signin");
      }, 2000);
    } else {
      setMessage({ type: "error", text: res.error || "An error occurred." });
      setIsLoading(false);
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      {message && (
        <div className={`p-3 text-sm rounded-lg text-center font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">New Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#008A4B] focus:border-[#008A4B] text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Confirm New Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#008A4B] focus:border-[#008A4B] text-sm"
            />
          </div>
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading || !password || !confirmPassword || message?.type === "success"}
          className="w-full flex justify-center py-3 bg-[#008A4B] hover:bg-[#006F3C] text-white rounded-xl text-sm font-bold shadow-sm transition disabled:opacity-50"
        >
          {isLoading ? "Resetting..." : "Reset Password"}
        </button>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 bg-card p-8 rounded-2xl shadow-sm border border-border"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Create New Password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please enter your new password below.
          </p>
        </div>

        <Suspense fallback={<div className="text-center p-4">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>

      </motion.div>
    </div>
  );
}
