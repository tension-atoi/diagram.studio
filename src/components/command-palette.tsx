"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Terminal,
  Cpu,
  Layers,
  Sun,
  Moon,
  ArrowRight,
  FolderGit2,
  Laptop,
} from "lucide-react";
import { useStudioTheme } from "~/lib/theme-context";

interface CommandItem {
  id: string;
  category: "Navigation" | "Presets" | "Inference" | "Theme" | "Actions";
  label: string;
  description?: string;
  shortcut?: string;
  icon: React.ComponentType<{ className?: string }>;
  onSelect: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onOpenModelDialog,
}: {
  isOpen: boolean;
  onClose: () => void;
  onOpenModelDialog: () => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const { setTheme } = useStudioTheme();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const commands: CommandItem[] = [
    {
      id: "preset-gnosis-os",
      category: "Presets",
      label: "tension-atoi/gnosis.os",
      description: "Cognitive OS Runtime & Monorepo Topology",
      icon: Terminal,
      onSelect: () => {
        router.push("/tension-atoi/gnosis.os");
        onClose();
      },
    },
    {
      id: "preset-gnosix",
      category: "Presets",
      label: "tension-atoi/gnosix",
      description: "Wayland GPUI Shell Architecture",
      icon: Terminal,
      onSelect: () => {
        router.push("/tension-atoi/gnosix");
        onClose();
      },
    },
    {
      id: "nav-studio",
      category: "Navigation",
      label: "Studio Home / Target Ingestion",
      description: "Inspect new or local repositories",
      shortcut: "G H",
      icon: FolderGit2,
      onSelect: () => {
        router.push("/");
        onClose();
      },
    },
    {
      id: "nav-browse",
      category: "Navigation",
      label: "Cached Repositories Catalog",
      description: "Browse locally cached architecture diagrams",
      shortcut: "G B",
      icon: Layers,
      onSelect: () => {
        router.push("/browse");
        onClose();
      },
    },
    {
      id: "inference-model-chooser",
      category: "Inference",
      label: "Configure AI Inference Model",
      description: "Switch between Ollama local and OpenRouter models",
      shortcut: "M",
      icon: Cpu,
      onSelect: () => {
        onClose();
        onOpenModelDialog();
      },
    },
    {
      id: "theme-dark",
      category: "Theme",
      label: "Switch Theme: Anthracite Dark",
      description: "Deep charcoal with high contrast beret accents",
      icon: Moon,
      onSelect: () => {
        setTheme("dark");
        onClose();
      },
    },
    {
      id: "theme-hybrid",
      category: "Theme",
      label: "Switch Theme: Studio Hybrid",
      description:
        "Anthracite shell with clean high-contrast white diagram island",
      icon: Laptop,
      onSelect: () => {
        setTheme("hybrid");
        onClose();
      },
    },
    {
      id: "theme-light",
      category: "Theme",
      label: "Switch Theme: Shell Light",
      description: "Soft clean paper aesthetic",
      icon: Sun,
      onSelect: () => {
        setTheme("light");
        onClose();
      },
    },
  ];

  const filtered = commands.filter((cmd) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      cmd.label.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q) ||
      cmd.description?.toLowerCase().includes(q)
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev <= 0 ? Math.max(0, filtered.length - 1) : prev - 1,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].onSelect();
      } else if (query.includes("/")) {
        router.push(`/${query.trim()}`);
        onClose();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="animate-in fade-in fixed inset-0 z-50 flex items-start justify-center bg-black/75 p-4 pt-20 backdrop-blur-sm duration-100"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-lg border border-[var(--border)] bg-[#14171c] font-sans text-[#e6e1e1] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center border-b border-[#252a32] bg-[#111418] px-4">
          <Search className="h-4 w-4 shrink-0 text-[#5F7F52]" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, repository (e.g. pallets/flask), or search..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full bg-transparent px-3 py-3.5 font-mono text-sm text-white placeholder:text-[#525a66] focus:outline-none"
          />
          <kbd className="hidden rounded border border-[#2B3037] bg-[#1c2027] px-1.5 py-0.5 font-mono text-[10px] text-[#8DA982] sm:inline-block">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 space-y-1 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="p-4 text-center">
              <p className="font-mono text-xs text-[#948f94]">
                No matching internal command.
              </p>
              {query.includes("/") && (
                <button
                  onClick={() => {
                    router.push(`/${query.trim()}`);
                    onClose();
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 rounded border border-[#3F5E36] bg-[#5F7F52]/20 px-3 py-1.5 font-mono text-xs text-[#8DA982] hover:bg-[#5F7F52]/30"
                >
                  <span>Open repository</span>
                  <span className="font-semibold text-white">
                    &quot;{query.trim()}&quot;
                  </span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => item.onSelect()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`group flex cursor-pointer items-center justify-between rounded px-3 py-2 transition-colors ${
                    isSelected
                      ? "border border-[#3F5E36]/80 bg-[#5F7F52]/20 text-white"
                      : "border border-transparent text-[#c2bebe] hover:bg-[#1c2026] hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded ${
                        isSelected
                          ? "bg-[#5F7F52] text-white"
                          : "border border-[#2B3037] bg-[#1c2026] text-[#8DA982]"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="flex flex-col">
                      <span className="font-sans text-xs font-medium">
                        {item.label}
                      </span>
                      {item.description && (
                        <span className="font-sans text-[11px] text-[#788290]">
                          {item.description}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded border border-[#252a32] bg-[#181c22] px-1.5 py-0.5 font-mono text-[10px] text-[#6d7786]">
                      {item.category}
                    </span>
                    {item.shortcut && (
                      <kbd className="hidden font-mono text-[10px] text-[#8DA982] sm:inline-block">
                        {item.shortcut}
                      </kbd>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Hint */}
        <div className="flex items-center justify-between border-t border-[#252a32] bg-[#111418] px-3 py-2 font-mono text-[11px] text-[#6e7888]">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="font-semibold text-[#5F7F52]">gnu.in.labs</span>
        </div>
      </div>
    </div>
  );
}
