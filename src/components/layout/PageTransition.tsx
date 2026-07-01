"use client";

import { motion } from "motion/react";
import { ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.98 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 25, 
        mass: 0.8 
      }}
      className="h-full w-full"
    >
      {children}
    </motion.div>
  );
}
