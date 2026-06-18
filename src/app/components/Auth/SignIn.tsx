"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";

export default function SignIn() {
  const [userType, setUserType] = useState<"corp" | "agent">("corp");
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

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
          onSubmit={(e) => {
            e.preventDefault();
            const email = emailRef.current?.value ?? "";
            const password = passwordRef.current?.value ?? "";
            // Admin shortcut: any toggle with admin/admin goes to /admin
            if ((email === "admin" || email === "admin@admin.com") && password === "admin") {
              window.location.href = "/admin";
              return;
            }
            window.location.href = userType === "corp" ? "/member" : "/agent";
          }}
        >
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email-address">
                Email address
              </label>
              <input
                ref={emailRef}
                id="email-address"
                name="email"
                type="text"
                autoComplete="email"
                required
                className="relative block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-[#008A4B] focus:outline-none focus:ring-[#008A4B] sm:text-sm"
                placeholder="Enter your email or username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
                Password
              </label>
              <input
                ref={passwordRef}
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-[#008A4B] focus:outline-none focus:ring-[#008A4B] sm:text-sm"
                placeholder="Enter your password"
              />
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
              className="group relative flex w-full justify-center rounded-lg border border-transparent bg-[#008A4B] py-2.5 px-4 text-sm font-medium text-white hover:bg-[#006F3C] focus:outline-none focus:ring-2 focus:ring-[#008A4B] focus:ring-offset-2 transition-colors"
            >
              Sign in
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
              <a
                href="#"
                className="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white py-2.5 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
              >
                <img
                  className="h-5 w-5 mr-2"
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google"
                />
                Google
              </a>
            </div>
            <div>
              <a
                href="#"
                className="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white py-2.5 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
              >
                <img
                  className="h-5 w-5 mr-2"
                  src="https://www.svgrepo.com/show/475647/facebook-color.svg"
                  alt="Facebook"
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
