"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const signUpSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function SignUp() {
  const [userType, setUserType] = useState<"corp" | "agent">("corp");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const handleGoogleSignUp = (e: React.MouseEvent) => {
    e.preventDefault();
    document.cookie = `auth_role=${userType}; path=/; max-age=300`;
    const callbackUrl = userType === "corp" ? "/member" : "/agent";
    signIn("google", { callbackUrl });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-sm">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Join CorperHome
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Create an account to get started
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
          className="mt-8 space-y-4"
          onSubmit={handleSubmit(async (data) => {
            const { name, email, password } = data;
            // Save the selected role into a cookie
            document.cookie = `auth_role=${userType}; path=/; max-age=300`;
            
            try {
              const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password, role: userType === "agent" ? "AGENT" : "CORP" })
              });

              if (!res.ok) {
                const errorData = await res.json();
                alert(errorData.message || "Registration failed");
                return;
              }

              // Call NextAuth signIn with credentials to log the new user in
              signIn("credentials", { 
                email, 
                password, 
                callbackUrl: userType === "corp" ? "/member" : "/agent" 
              });
            } catch (err) {
              console.error("Error during signup:", err);
              alert("An unexpected error occurred during sign up.");
            }
          })}
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="full-name">
              Full Name
            </label>
            <input
              id="full-name"
              type="text"
              {...register("name")}
              className="relative block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-[#008A4B] focus:outline-none focus:ring-[#008A4B] sm:text-sm"
              placeholder="Enter your full name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email-address">
              Email address
            </label>
            <input
              id="email-address"
              type="email"
              autoComplete="email"
              {...register("email")}
              className="relative block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-[#008A4B] focus:outline-none focus:ring-[#008A4B] sm:text-sm"
              placeholder="Enter your email"
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
              autoComplete="new-password"
              {...register("password")}
              className="relative block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-[#008A4B] focus:outline-none focus:ring-[#008A4B] sm:text-sm"
              placeholder="Create a password"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="group relative flex w-full justify-center rounded-lg border border-transparent bg-[#008A4B] py-2.5 px-4 text-sm font-medium text-white hover:bg-[#006F3C] focus:outline-none focus:ring-2 focus:ring-[#008A4B] focus:ring-offset-2 transition-colors"
            >
              Sign up
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">Or sign up with</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div>
              <button
                type="button"
                onClick={handleGoogleSignUp}
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
          Already have an account?{" "}
          <Link href="/signin" className="font-medium text-[#008A4B] hover:text-[#006F3C]">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
