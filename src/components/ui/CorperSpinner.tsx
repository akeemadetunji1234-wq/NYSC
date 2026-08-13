"use client";

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import Image from "next/image";

export function CorperSpinner() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 100 : prev + 2));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const bobTransition = {
    duration: 0.5,
    repeat: Infinity,
    repeatType: "reverse" as const,
    ease: "easeInOut",
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm">
      <div className="relative w-full max-w-md h-[400px] flex flex-col items-center justify-end overflow-hidden pb-8">
        
        {/* Animated Image Container */}
        <div className="relative w-full h-[250px] mb-8 animate-march">
          {/* Dust particles */}
          <div className="absolute -bottom-2 left-[20%] w-full h-full pointer-events-none">
            <div className="dust-particle dust-left"></div>
            <div className="dust-particle dust-right"></div>
          </div>
          
          <Image 
            src="/corper-spinner.png" 
            alt="Corpers marching" 
            fill 
            className="object-contain drop-shadow-md z-10 relative"
            priority
          />
        </div>

        {/* Text & Progress Bar */}
        <div className="mt-4 w-full flex flex-col items-center">
          <div className="flex items-center gap-1 mb-4 text-[#166534] font-bold text-xl md:text-2xl">
            Finding affordable homes
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, times: [0, 0.5, 1] }}
            >
              .
            </motion.span>
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, times: [0, 0.5, 1], delay: 0.2 }}
            >
              .
            </motion.span>
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, times: [0, 0.5, 1], delay: 0.4 }}
            >
              .
            </motion.span>
          </div>
          
          {/* Progress bar container */}
          <div className="w-64 h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
            <motion.div 
              className="h-full bg-[#166534] rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeOut", duration: 0.2 }}
            />
          </div>
          <p className="mt-3 text-sm font-medium text-gray-500">Loading...</p>
        </div>

      </div>
    </div>
  );
}
