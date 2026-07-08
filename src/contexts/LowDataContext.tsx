"use client";

import { createContext, useContext, useEffect, useState } from "react";

const LowDataContext = createContext<{
  lowDataMode: boolean;
  setLowDataMode: (v: boolean) => void;
}>({
  lowDataMode: false,
  setLowDataMode: () => {},
});

export function LowDataProvider({ children }: { children: React.ReactNode }) {
  const [lowDataMode, setLowDataMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("lowDataMode");
    if (saved === "true") setLowDataMode(true);
  }, []);

  const updateMode = (v: boolean) => {
    setLowDataMode(v);
    localStorage.setItem("lowDataMode", String(v));
  };

  return (
    <LowDataContext.Provider value={{ lowDataMode, setLowDataMode: updateMode }}>
      {children}
    </LowDataContext.Provider>
  );
}

export function useLowData() {
  return useContext(LowDataContext);
}
