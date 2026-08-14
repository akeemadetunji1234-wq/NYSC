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

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm">
      <div className="relative w-full max-w-md h-[400px] flex flex-col items-center justify-end overflow-hidden pb-8">
        {/* The source artwork already depicts Corpers in a walking stride. Crop its
            baked-in caption/progress area and translate the figures forward without
            rotation or vertical bobbing, which was the previous shake bug. */}
        <motion.div
          className="relative w-full h-[250px] mb-8 overflow-hidden"
          animate={{
            x: [-22, -8, 8, 22, -22],
            scale: [1, 1.01, 1, 1.01, 1],
          }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <Image
            src="/corper-spinner.png"
            alt="Corp members marching"
            fill
            className="object-cover object-top drop-shadow-md"
            sizes="(max-width: 768px) 100vw, 448px"
            priority
          />
        </motion.div>

        <div className="mt-4 w-full flex flex-col items-center">
          <div className="flex items-center gap-1 mb-4 text-[#166534] font-bold text-xl md:text-2xl">
            Finding affordable homes
            {[0, 1, 2].map((dot) => (
              <motion.span
                key={dot}
                animate={{ opacity: [0, 1, 0] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  times: [0, 0.5, 1],
                  delay: dot * 0.2,
                }}
              >
                .
              </motion.span>
            ))}
          </div>

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
