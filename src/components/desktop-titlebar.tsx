"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cpu, Layers, Search, Key, Zap, FolderGit2 } from "lucide-react";
import { ProviderModelDialog } from "./provider-model-dialog";
import { ThemeSwitcher } from "./theme-switcher";
import { CommandPalette } from "./command-palette";
import { ApiKeyDialog } from "./api-key-dialog";
import { useStudioLanguage } from "~/components/studio-language-provider";

export function DesktopTitlebar() {
  const pathname = usePathname();
  const [isModelDialogOpen, setIsModelDialogOpen] = useState(false);
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [activeModel, setActiveModel] = useState<string>("qwen3.6:35b-studio");
  const [activeProvider, setActiveProvider] = useState<string>("ollama");
  const { t } = useStudioLanguage();

  useEffect(() => {
    fetch("/api/settings/model")
      .then((res) => res.json())
      .then((data) => {
        if (data.activeModel) setActiveModel(data.activeModel);
        if (data.activeProvider) setActiveProvider(data.activeProvider);
      })
      .catch(() => undefined);
  }, []);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const formatModelLabel = (model: string) => {
    const parts = model.split("/");
    const slug = parts[parts.length - 1]?.replace(/:free$/, "") || model;
    return slug;
  };

  const isHome = pathname === "/";
  const isBrowse = pathname.startsWith("/browse");

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[#111418]/95 backdrop-blur-md transition-colors duration-150 select-none">
        {/* Main Titlebar / Command Bar */}
        <div className="flex h-12 w-full items-center justify-between px-3 sm:px-5">
          {/* Left: Suite Brand Signature & Window Anchor */}
          <div className="flex items-center gap-3">
            <Link href="/" className="group flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded border border-[#3F5E36] bg-[#5F7F52]/20 font-mono text-xs font-bold text-[#8DA982] shadow-[0_0_10px_rgba(95,127,82,0.2)] transition-all group-hover:border-[#5F7F52] group-hover:bg-[#5F7F52]/30">
                ⬡
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-sans text-xs font-bold tracking-tight text-white transition-colors group-hover:text-[#8DA982]">
                  gnu.in.labs
                </span>
                <span className="font-mono text-[11px] text-[#525a66]">/</span>
                <span className="font-mono text-xs font-semibold tracking-wider text-[#8DA982] uppercase">
                  DIAGRAM.STUDIO
                </span>
              </div>
            </Link>

            {/* Segmented Desktop Navigation */}
            <nav className="ml-4 hidden items-center space-x-1 border-l border-[#2B3037] pl-4 md:flex">
              <Link
                href="/"
                className={`flex items-center gap-1.5 rounded px-2.5 py-1 font-mono text-xs transition-colors ${
                  isHome
                    ? "border border-[#3A414B] bg-[#1f242c] font-medium text-white"
                    : "text-[#828c9b] hover:bg-[#181c22] hover:text-white"
                }`}
              >
                <FolderGit2 className="h-3 w-3 text-[#5F7F52]" />
                <span>{t("titlebar.ingest")}</span>
              </Link>

              <Link
                href="/browse"
                className={`flex items-center gap-1.5 rounded px-2.5 py-1 font-mono text-xs transition-colors ${
                  isBrowse
                    ? "border border-[#3A414B] bg-[#1f242c] font-medium text-white"
                    : "text-[#828c9b] hover:bg-[#181c22] hover:text-white"
                }`}
              >
                <Layers className="h-3 w-3 text-[#8DA982]" />
                <span>{t("titlebar.cache")}</span>
              </Link>
            </nav>
          </div>

          {/* Center: Command Palette Trigger */}
          <div className="mx-4 hidden max-w-sm flex-1 sm:block">
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="flex w-full cursor-pointer items-center justify-between rounded border border-[#2B3037] bg-[#16191e] px-3 py-1 font-mono text-xs text-[#788290] shadow-inner transition-all hover:border-[#3A414B] hover:bg-[#1b1f26] hover:text-[#a0aab8]"
            >
              <span className="flex items-center gap-2">
                <Search className="h-3 w-3 text-[#5F7F52]" />
                <span className="truncate">
                  {t("titlebar.searchPlaceholder")}
                </span>
              </span>
              <kbd className="rounded border border-[#2B3037] bg-[#1c2027] px-1 py-0.5 text-[9px] font-semibold text-[#8DA982]">
                Ctrl+K
              </kbd>
            </button>
          </div>

          {/* Right: Engine Telemetry, Jev Pill & Theme Switcher */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Jev System One Status Pill */}
            <div
              className="hidden items-center gap-1.5 rounded border border-[#3F5E36]/40 bg-[#141b12] px-2 py-1 font-mono text-[11px] text-[#8DA982] lg:flex"
              title={t("titlebar.jevTooltip")}
            >
              <Zap className="h-3 w-3 fill-[#8DA982]/30 text-[#8DA982]" />
              <span className="text-[10px] font-semibold tracking-wide uppercase">
                JEV S1
              </span>
            </div>

            {/* Active Model Pill */}
            <button
              onClick={() => setIsModelDialogOpen(true)}
              className="flex cursor-pointer items-center gap-1.5 rounded border border-[#3F5E36]/70 bg-[#162014] px-2.5 py-1 font-mono text-xs text-[#e6e1e1] transition-all hover:border-[#5F7F52] hover:bg-[#1c2919] hover:shadow-[0_0_10px_rgba(95,127,82,0.2)]"
              title={t("titlebar.engineTooltip")}
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#5F7F52]" />
              <Cpu className="h-3 w-3 text-[#8DA982]" />
              <span className="max-w-[120px] truncate font-medium text-white sm:max-w-none">
                {formatModelLabel(activeModel)}
              </span>
              <span className="rounded border border-[#3F5E36] bg-[#5F7F52]/20 px-1 text-[9px] font-semibold text-[#8DA982] uppercase">
                {activeProvider}
              </span>
            </button>

            {/* API Key Modal Trigger */}
            <button
              onClick={() => setIsApiKeyDialogOpen(true)}
              className="hidden h-7 w-7 cursor-pointer items-center justify-center rounded border border-[#2B3037] bg-[#16191e] text-[#828c9b] transition-colors hover:border-[#3A414B] hover:bg-[#1f242c] hover:text-white sm:flex"
              title={t("titlebar.apiKeyTooltip")}
            >
              <Key className="h-3.5 w-3.5" />
            </button>

            {/* Theme Switcher */}
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      {/* Model Selection Modal */}
      <ProviderModelDialog
        isOpen={isModelDialogOpen}
        onClose={() => setIsModelDialogOpen(false)}
        onModelChanged={(m) => setActiveModel(m)}
      />

      {/* API Key / Credentials Modal */}
      <ApiKeyDialog
        isOpen={isApiKeyDialogOpen}
        onClose={() => setIsApiKeyDialogOpen(false)}
      />

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenModelDialog={() => setIsModelDialogOpen(true)}
      />
    </>
  );
}
