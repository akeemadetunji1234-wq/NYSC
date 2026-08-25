"use client";

import React from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

interface PremiumButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
  variant?: "primary" | "glow" | "shimmer" | "outline" | "light";
  className?: string;
  type?: React.ButtonHTMLAttributes<HTMLButtonElement>["type"];
}

export function PremiumButton({
  children,
  variant = "primary",
  className,
  ...props
}: PremiumButtonProps) {
  const baseClasses =
    "relative inline-flex h-12 items-center justify-center overflow-hidden rounded-md px-8 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary";

  if (variant === "shimmer") {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "inline-flex h-12 animate-shimmer items-center justify-center rounded-md border border-slate-800 bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] bg-[length:200%_100%] px-6 font-medium text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50",
          className
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  }

  if (variant === "light") {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "group isolate relative inline-flex h-12 items-center justify-center overflow-hidden rounded-md border border-white/90 bg-gradient-to-br from-white via-white to-emerald-50 px-6 font-semibold text-[#0d1f15] shadow-[0_12px_30px_rgba(15,72,42,0.18)] transition-all hover:-translate-y-0.5 hover:from-white hover:to-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-white before:pointer-events-none before:absolute before:inset-[1px] before:rounded-[inherit] before:bg-gradient-to-b before:from-white/95 before:via-white/45 before:to-transparent before:opacity-90 before:content-[''] after:pointer-events-none after:absolute after:-right-8 after:-top-10 after:h-24 after:w-24 after:rotate-12 after:rounded-full after:bg-white/70 after:blur-xl after:transition-transform after:duration-500 group-hover:after:translate-x-2 group-hover:after:translate-y-1",

          className
        )}
        {...props}
      >
        <span className="relative z-10 inline-flex items-center">{children}</span>
      </motion.button>
    );
  }

  if (variant === "glow") {
    return (
      <div className={cn("relative group", className)}>
        <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg blur opacity-50 group-hover:opacity-100 transition duration-500 group-hover:duration-200 animate-pulse-slow"></div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "relative flex h-12 w-full items-center justify-center bg-black text-white rounded-lg px-8 py-4 font-semibold leading-none"
          )}
          {...props}
        >
          {children}
        </motion.button>
      </div>
    );
  }

  // Default Primary (Scale effect)
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "bg-primary text-primary-foreground hover:bg-primary/90",
        baseClasses,
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
