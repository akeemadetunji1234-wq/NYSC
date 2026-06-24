"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const signInSchema = z.object({
  email: z.string().min(3, "Email or username must be at least 3 characters"),
  password: z.string().min(4, "Password must be at least 4 characters"),
});

type SignInFormValues = z.infer<typeof signInSchema>;

export default function SignIn() {
  const [userType, setUserType] = useState<"corp" | "agent">("corp");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const handleGoogleSignIn = (e: React.MouseEvent) => {
    e.preventDefault();
    // Save the selected role into a cookie for the NextAuth callback to pick up
    document.cookie = `auth_role=${userType}; path=/; max-age=300`;
    // Decide the destination based on role
    const callbackUrl = userType === "corp" ? "/member" : "/agent";
    
    signIn("google", { callbackUrl });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-sm">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please enter your details to sign in
          </p>
        </div>

        {/* User Type Toggle */}
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            className={`w-1/2 rounded-md py-2.5 text-sm font-medium transition-all ${
              userType === "corp"
                ? "bg-white text-gray-900 shadow"
                : "text-gray-500 hover:text-gray-900"
            }`}
            onClick={() => setUserType("corp")}
          >
            Corp Member
          </button>
          <button
            type="button"
            className={`w-1/2 rounded-md py-2.5 text-sm font-medium transition-all ${
              userType === "agent"
                ? "bg-white text-gray-900 shadow"
                : "text-gray-500 hover:text-gray-900"
            }`}
            onClick={() => setUserType("agent")}
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
            // Save the selected role into a cookie
            document.cookie = `auth_role=${userType}; path=/; max-age=300`;
            
            // Admin shortcut: any toggle with admin/admin goes to /admin
            if ((email === "admin" || email === "admin@admin.com") && password === "admin") {
              const res = await signIn("credentials", { email: "admin", password: "admin", redirect: false });
              if (res?.ok) {
                window.location.href = "/admin";
              }
              setIsLoading(false);
              return;
            }
            
            // Regular user login
            const res = await signIn("credentials", { 
              email, 
              password, 
              redirect: false
            });

            if (res?.error) {
              setLoginError("Invalid email or password");
              setIsLoading(false);
            } else if (res?.ok) {
              window.location.href = userType === "corp" ? "/member" : "/agent";
            }
          })}
        >
          {loginError && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm text-center">
              {loginError}
            </div>
          )}
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email-address">
                Email address
              </label>
              <input
                id="email-address"
                type="text"
                autoComplete="email"
                {...register("email")}
                className="relative block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-[#008A4B] focus:outline-none focus:ring-[#008A4B] sm:text-sm"
                placeholder="Enter your email or username"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register("password")}
                className="relative block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-[#008A4B] focus:outline-none focus:ring-[#008A4B] sm:text-sm"
                placeholder="Enter your password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-[#008A4B] focus:ring-[#008A4B]"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-[#008A4B] hover:text-[#006F3C]">
                Forgot your password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-lg border border-transparent bg-[#008A4B] py-2.5 px-4 text-sm font-medium text-white hover:bg-[#006F3C] focus:outline-none focus:ring-2 focus:ring-[#008A4B] focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              <span className="bg-white px-2 text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white py-2.5 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
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
              <a
                href="#"
                className="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white py-2.5 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
              >
                <Image
                  className="mr-2"
                  src="https://www.svgrepo.com/show/475647/facebook-color.svg"
                  alt="Facebook"
                  width={20}
                  height={20}
                />
                Facebook
              </a>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <Link href="/signup" className="font-medium text-[#008A4B] hover:text-[#006F3C]">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
