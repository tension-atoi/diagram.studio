"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type StudioTheme = "hybrid" | "dark" | "light";

interface ThemeContextType {
  theme: StudioTheme;
  setTheme: (theme: StudioTheme) => void;
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "hybrid",
  setTheme: () => undefined,
  cycleTheme: () => undefined,
});

const THEME_STORAGE_KEY = "gnu-studio-theme";

function applyThemeToDocument(t: StudioTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", t);
  if (t === "light") {
    root.classList.remove("dark");
    root.classList.add("light");
  } else {
    root.classList.remove("light");
    root.classList.add("dark");
  }
}

export function StudioThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState<StudioTheme>("hybrid");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(
        THEME_STORAGE_KEY,
      ) as StudioTheme | null;
      if (stored === "hybrid" || stored === "dark" || stored === "light") {
        setThemeState(stored);
        applyThemeToDocument(stored);
      } else {
        applyThemeToDocument("hybrid");
      }
    } catch {
      applyThemeToDocument("hybrid");
    }
  }, []);

  const setTheme = (nextTheme: StudioTheme) => {
    setThemeState(nextTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // ignore
    }
    applyThemeToDocument(nextTheme);
  };

  const cycleTheme = () => {
    const order: StudioTheme[] = ["hybrid", "dark", "light"];
    const nextIndex = (order.indexOf(theme) + 1) % order.length;
    setTheme(order[nextIndex]!);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useStudioTheme() {
  return useContext(ThemeContext);
}
