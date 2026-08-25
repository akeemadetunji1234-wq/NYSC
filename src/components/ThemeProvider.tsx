"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useLayoutEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  attribute?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);
const LEGACY_THEME_KEYS = ["theme-member", "theme-agent", "theme-admin"];
const AUTH_ROUTE_PATHS = new Set(["/signin", "/signup", "/forgot-password", "/reset-password", "/verify-google"]);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme",
  enableSystem = true,
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const pathname = usePathname();
  const isAuthRoute = pathname !== null && AUTH_ROUTE_PATHS.has(pathname);
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isAuthRoute) {
      setThemeState("light");
      return;
    }

    const sharedTheme = localStorage.getItem(storageKey) as Theme | null;
    if (sharedTheme === "light" || sharedTheme === "dark" || sharedTheme === "system") {
      setThemeState(sharedTheme);
      return;
    }

    const legacyTheme = LEGACY_THEME_KEYS
      .map((key) => localStorage.getItem(key))
      .find((value): value is Theme => value === "light" || value === "dark" || value === "system");

    if (legacyTheme) {
      setThemeState(legacyTheme);
      localStorage.setItem(storageKey, legacyTheme);
    }
  }, [storageKey, isAuthRoute]);

  useLayoutEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;
    if (isAuthRoute || root.dataset.authTheme === "light") {
      root.classList.remove("light", "dark");
      root.classList.add("light");
      root.style.colorScheme = "light";
      root.dataset.authTheme = "light";
      return;
    }

    delete root.dataset.authTheme;

    const resolvedTheme = theme === "system"
      ? (enableSystem && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : theme;

    if (disableTransitionOnChange) {
      root.classList.add("theme-transition-disabled");
      window.setTimeout(() => root.classList.remove("theme-transition-disabled"), 0);
    }

    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);

    if (theme === "system") {
      localStorage.removeItem(storageKey);
    } else {
      localStorage.setItem(storageKey, theme);
    }
  }, [theme, mounted, storageKey, enableSystem, disableTransitionOnChange, isAuthRoute]);

  useEffect(() => {
    if (!mounted || isAuthRoute || theme !== "system" || !enableSystem) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => {
      const root = window.document.documentElement;
      if (root.dataset.authTheme === "light") {
        root.classList.remove("light", "dark");
        root.classList.add("light");
        root.style.colorScheme = "light";
        return;
      }
      root.classList.toggle("dark", mediaQuery.matches);
      root.classList.toggle("light", !mediaQuery.matches);
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, [mounted, theme, enableSystem]);

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme: setThemeState }}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
