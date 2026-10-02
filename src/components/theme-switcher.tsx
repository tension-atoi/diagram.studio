"use client";

import React from "react";
import { Layers, Moon, Sun } from "lucide-react";
import { useStudioTheme, type StudioTheme } from "~/lib/theme-context";

export function ThemeSwitcher() {
  const { theme, cycleTheme } = useStudioTheme();

  const getThemeInfo = (t: StudioTheme) => {
    switch (t) {
      case "hybrid":
        return {
          label: "HYBRID",
          icon: Layers,
          color: "text-[#8DA982]",
          dot: "bg-[#5F7F52]",
          border: "border-[#3F5E36]/60",
          bg: "bg-[#1c241a]",
          hoverBg: "hover:bg-[#233020]",
          tooltip:
            "Active: Hybrid (Dark Canvas + Paper Islands). Click to cycle.",
        };
      case "dark":
        return {
          label: "DARK",
          icon: Moon,
          color: "text-[#c4b5fd]",
          dot: "bg-[#8b5cf6]",
          border: "border-[#5b21b6]/60",
          bg: "bg-[#1e172a]",
          hoverBg: "hover:bg-[#2b1f40]",
          tooltip: "Active: Deep Dark Console. Click to cycle.",
        };
      case "light":
        return {
          label: "LIGHT",
          icon: Sun,
          color: "text-[#d97706]",
          dot: "bg-[#f59e0b]",
          border: "border-[#b45309]/60",
          bg: "bg-[#2a2215]",
          hoverBg: "hover:bg-[#382d1c]",
          tooltip: "Active: Laboratory Light. Click to cycle.",
        };
    }
  };

  const info = getThemeInfo(theme);
  const IconComponent = info.icon;

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className={`flex items-center gap-1.5 rounded border ${info.border} ${info.bg} ${info.hoverBg} cursor-pointer px-2.5 py-1.5 font-mono text-xs text-[#e6e1e1] shadow-sm transition-all`}
      title={info.tooltip}
      aria-label={`Current theme: ${info.label}. Click to switch theme.`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${info.dot}`} />
      <IconComponent className={`h-3.5 w-3.5 ${info.color}`} />
      <span className="text-[11px] font-semibold tracking-wider text-white">
        {info.label}
      </span>
    </button>
  );
}
