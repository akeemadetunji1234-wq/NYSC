"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "motion/react";
import { getUserRoleByEmail } from "../../../app/actions/auth";

const signInSchema = z.object({
  email: z.string().min(3, "Email or username must be at least 3 characters"),
  password: z.string().min(4, "Password must be at least 4 characters"),
});

type SignInFormValues = z.infer<typeof signInSchema>;

export default function SignIn() {
  const [userType, setUserType] = useState<"CORP" | "AGENT" | "ADMIN">("CORP");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleGoogleSignIn = (e: React.MouseEvent) => {
    e.preventDefault();
    document.cookie = `auth_role=${userType.toLowerCase()}; path=/; max-age=300`;
    const callbackUrl = userType === "CORP" ? "/member" : userType === "AGENT" ? "/agent" : "/admin";
    signIn("google", { callbackUrl });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <motion.div 
        animate={isShaking ? { x: [-10, 10, -10, 10, -5, 5, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md space-y-8 bg-card p-8 rounded-2xl shadow-sm border border-border"
      >
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <span className="text-2xl font-black tracking-tight text-[#008A4B]">Corper<span className="text-slate-900">Home</span></span>
          </div>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please enter your details to sign in
          </p>
        </div>

        {/* Role Tabs */}
        <div className="flex rounded-lg bg-gray-100 p-1 border border-slate-200">
          <button
            type="button"
            className={`w-1/2 rounded-md py-2.5 text-xs font-semibold transition-all cursor-pointer ${
              userType === "CORP"
                ? "bg-card text-gray-900 shadow"
                : "text-gray-500 hover:text-gray-900"
            }`}
            onClick={() => {
              setUserType("CORP");
              setLoginError(null);
            }}
          >
            Corp Member
          </button>
          <button
            type="button"
            className={`w-1/2 rounded-md py-2.5 text-xs font-semibold transition-all cursor-pointer ${
              userType === "AGENT"
                ? "bg-card text-gray-900 shadow"
                : "text-gray-500 hover:text-gray-900"
            }`}
            onClick={() => {
              setUserType("AGENT");
              setLoginError(null);
            }}
          >
            Property Agent
          </button>
        </div>

        <form 
          className="mt-8 space-y-6" 
          onSubmit={handleSubmit(async (data) => {
            setLoginError(null);
            setIsLoading(true);
            const { email, password } = data;
            
            // 1. Check if ADMIN shortcut is used
            if (email === "admin" && password === "admin") {
              document.cookie = `auth_role=admin; path=/; max-age=300`;
              const res = await signIn("credentials", { email: "admin", password: "admin", redirect: false });
              if (res?.ok) {
                window.location.href = "/admin";
              } else {
                triggerShake();
                setLoginError("Invalid credentials");
              }
              setIsLoading(false);
              return;
            }

            // 2. Validate Role Mismatch BEFORE attempting NextAuth sign in
            if (email.includes("@")) {
              const actualRole = await getUserRoleByEmail(email);
              if (actualRole === "ADMIN") {
                document.cookie = `auth_role=admin; path=/; max-age=300`;
                const res = await signIn("credentials", { email, password, redirect: false });
                if (res?.error) {
                  triggerShake();
                  setLoginError("Invalid email or password");
                  setIsLoading(false);
                } else if (res?.ok) {
                  window.location.href = "/admin";
                }
                return;
              } else if (actualRole && actualRole !== userType) {
                triggerShake();
                setLoginError(`This account is registered as a ${actualRole === "CORP" ? "Corp Member" : "Property Agent"}. Please select the correct tab.`);
                setIsLoading(false);
                return;
              }
            }

            // Save the selected role into a cookie
            document.cookie = `auth_role=${userType.toLowerCase()}; path=/; max-age=300`;

            // 3. Regular user login
            const res = await signIn("credentials", { 
              email, 
              password, 
              redirect: false
            });

            if (res?.error) {
              triggerShake();
              setLoginError("Invalid email or password");
              setIsLoading(false);
            } else if (res?.ok) {
              window.location.href = userType === "CORP" ? "/member" : "/agent";
            }
          })}
        >
          {loginError && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-xs text-center font-medium animate-in fade-in duration-200">
              {loginError}
            </div>
          )}
          <div className="space-y-4 rounded-md">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="email-address">
                Email address
              </label>
              <input
                id="email-address"
                type="text"
                autoComplete="email"
                {...register("email")}
                className="relative block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:z-10 focus:border-[#008A4B] focus:outline-none focus:ring-1 focus:ring-[#008A4B] sm:text-sm bg-card transition"
                placeholder={userType === "ADMIN" ? "Enter admin username or email" : "Enter your email"}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register("password")}
                className="relative block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:z-10 focus:border-[#008A4B] focus:outline-none focus:ring-1 focus:ring-[#008A4B] sm:text-sm bg-card transition"
                placeholder="Enter your password"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-[#008A4B] focus:ring-[#008A4B] cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 cursor-pointer">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link href="/forgot-password" className="font-semibold text-[#008A4B] hover:text-[#006F3C]">
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-xl border border-transparent bg-[#008A4B] py-3 px-4 text-sm font-bold text-white hover:bg-[#006F3C] focus:outline-none focus:ring-2 focus:ring-[#008A4B] focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-card px-2 text-gray-500 font-medium">Or continue with</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="flex w-full items-center justify-center rounded-xl border border-gray-300 bg-card py-2.5 px-4 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <Image
                  className="mr-2"
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google"
                  width={20}
                  height={20}
                />
                Google
              </button>
            </div>
            <div>
              <button
                type="button"
                className="flex w-full items-center justify-center rounded-xl border border-gray-300 bg-card py-2.5 px-4 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <Image
                  className="mr-2"
                  src="https://www.svgrepo.com/show/475647/facebook-color.svg"
                  alt="Facebook"
                  width={20}
                  height={20}
                />
                Facebook
              </button>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <Link href="/signup" className="font-semibold text-[#008A4B] hover:text-[#006F3C]">
            Sign up
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
