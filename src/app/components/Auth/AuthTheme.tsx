"use client";

import { useLayoutEffect, type ReactNode } from "react";

const AUTH_THEME_SNAPSHOT_KEY = "na-theme-before-auth";

type ThemeSnapshot = {
  className: string;
  colorScheme: string;
};

function readSnapshot(): ThemeSnapshot | null {
  try {
    const value = window.sessionStorage.getItem(AUTH_THEME_SNAPSHOT_KEY);
    return value ? (JSON.parse(value) as ThemeSnapshot) : null;
  } catch {
    return null;
  }
}

function applyLightTheme() {
  const root = document.documentElement;
  root.classList.remove("dark", "system");
  root.classList.add("light");
  root.style.colorScheme = "light";
  root.dataset.authTheme = "light";
}

export function prepareAuthLightMode() {
  if (typeof window === "undefined") return;

  try {
    if (!window.sessionStorage.getItem(AUTH_THEME_SNAPSHOT_KEY)) {
      window.sessionStorage.setItem(
        AUTH_THEME_SNAPSHOT_KEY,
        JSON.stringify({
          className: document.documentElement.className,
          colorScheme: document.documentElement.style.colorScheme,
        }),
      );
    }
  } catch {
    // Continue with the light transition even when sessionStorage is unavailable.
  }

  applyLightTheme();

  try {
    window.localStorage.setItem("theme", "light");
    window.localStorage.setItem("theme-member", "light");
    window.localStorage.setItem("theme-agent", "light");
    window.localStorage.setItem("theme-admin", "light");
  } catch {
    // The DOM reset above still guarantees a light logout screen if storage is unavailable.
  }
}

export function AuthTheme({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    const previous = readSnapshot() ?? {
      className: root.className,
      colorScheme: root.style.colorScheme,
    };

    applyLightTheme();

    return () => {
      root.className = previous.className;
      root.style.colorScheme = previous.colorScheme;
      delete root.dataset.authTheme;
      try {
        window.sessionStorage.removeItem(AUTH_THEME_SNAPSHOT_KEY);
      } catch {
        // Ignore storage cleanup failures; the next auth mount will re-establish its snapshot.
      }
    };
  }, []);

  return <div data-auth-surface className="block min-h-screen bg-white text-gray-900" style={{ backgroundColor: "#f9fafb", color: "#111827" }}>{children}</div>;
}
