"use client";

import React, { useEffect, useState } from "react";
import { Cpu, Check, X, HardDrive, Cloud } from "lucide-react";
import type { ModelPreset } from "~/app/api/settings/model/route";
import { useStudioLanguage } from "~/components/studio-language-provider";
import { LANGS, format, type Lang, type MessageKey } from "~/lib/i18n";

/** Language names and codes, kept out of the switch so both stay readable. */
const LANGUAGE_OPTIONS: Record<
  Lang,
  { nameKey: MessageKey; shortKey: MessageKey }
> = {
  en: {
    nameKey: "settings.languageEnglish",
    shortKey: "settings.languageEnglishShort",
  },
  fr: {
    nameKey: "settings.languageFrench",
    shortKey: "settings.languageFrenchShort",
  },
};

interface ProviderModelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onModelChanged?: (model: string) => void;
}

export function ProviderModelDialog({
  isOpen,
  onClose,
  onModelChanged,
}: ProviderModelDialogProps) {
  const [activeModel, setActiveModel] = useState<string>("qwen3.6:35b-studio");
  const [activeProvider, setActiveProvider] = useState<string>("ollama");
  const [models, setModels] = useState<ModelPreset[]>([]);
  const [customModel, setCustomModel] = useState<string>("");
  const [filter, setFilter] = useState<"all" | "ollama" | "openrouter">("all");
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const { lang, setLang, t } = useStudioLanguage();

  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/settings/model")
      .then((res) => res.json())
      .then((data) => {
        if (data.activeModel) setActiveModel(data.activeModel);
        if (data.activeProvider) setActiveProvider(data.activeProvider);
        if (data.models) setModels(data.models);
      })
      .catch(() => undefined);
  }, [isOpen]);

  const selectModel = async (modelId: string, provider: string) => {
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/settings/model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: modelId, provider }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveModel(modelId);
        setActiveProvider(provider);
        setStatusMessage(t("settings.modelUpdated"));
        if (onModelChanged) onModelChanged(modelId);
        setTimeout(() => {
          onClose();
          setStatusMessage(null);
        }, 500);
      }
    } catch {
      setStatusMessage(t("settings.modelSwitchFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customModel.trim()) return;
    selectModel(customModel.trim(), "openrouter");
  };

  if (!isOpen) return null;

  const filteredModels = models.filter((m) => {
    if (filter === "ollama") return m.provider === "ollama";
    if (filter === "openrouter") return m.provider === "openrouter";
    return true;
  });

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm duration-100">
      <div className="relative w-full max-w-2xl rounded-lg border border-[var(--border)] bg-[#14171c] p-6 font-sans text-[var(--foreground)] shadow-2xl transition-colors [data-theme=light]:border-[#e2e4e8] [data-theme=light]:bg-white">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between border-b border-[#252a32] pb-4 [data-theme=light]:border-[#eef0f3]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded border border-[#3F5E36] bg-[#5F7F52]/20 text-[#5F7F52]">
              <Cpu className="h-4 w-4" />
            </span>
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-[var(--foreground)]">
                <span>gnu.in.labs</span>
                <span className="rounded border border-[#5F7F52]/30 bg-[#5F7F52]/10 px-1.5 py-0.5 font-mono text-[10px] text-[#5F7F52] uppercase">
                  {t("settings.inferenceChooser")}
                </span>
              </h2>
              <p className="mt-0.5 font-mono text-xs text-[var(--muted-foreground)]">
                {t("settings.inferenceChooserSubtitle")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-[#828c9b] transition-colors hover:bg-[#1f242c] hover:text-[var(--foreground)] [data-theme=light]:hover:bg-[#f0f3f6]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Current status pill */}
        <div className="mb-4 flex items-center justify-between rounded border border-[#2B3037] bg-[#0f1216] px-3 py-2 font-mono text-xs [data-theme=light]:border-[#d0d7de] [data-theme=light]:bg-[#f6f8fa]">
          <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#5F7F52]" />
            <span>{t("settings.activeEngine")}</span>
            <span className="font-semibold text-[var(--foreground)]">
              {activeModel}
            </span>
          </div>
          <span className="rounded border border-[#3F5E36] bg-[#5F7F52]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#5F7F52] uppercase">
            {activeProvider}
          </span>
        </div>

        {/* Language switch: reachable from this settings surface at any time. */}
        <div
          className="mb-3 flex items-center justify-end gap-1.5"
          role="group"
          aria-label={t("settings.languageGroupLabel")}
        >
          <span className="mr-1 font-mono text-[10px] font-semibold tracking-wide text-[var(--muted-foreground)] uppercase">
            {t("settings.language")}
          </span>
          {LANGS.map((option) => {
            const isActive = option === lang;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setLang(option)}
                aria-pressed={isActive}
                aria-label={t(LANGUAGE_OPTIONS[option].nameKey)}
                className={`cursor-pointer rounded border px-2 py-0.5 font-mono text-[11px] transition-colors ${
                  isActive
                    ? "border-[#5F7F52] bg-[#5F7F52]/20 font-semibold text-[#8DA982]"
                    : "border-[#2B3037] text-[var(--muted-foreground)] hover:text-[var(--foreground)] [data-theme=light]:border-[#d0d7de]"
                }`}
              >
                {t(LANGUAGE_OPTIONS[option].shortKey)}
              </button>
            );
          })}
        </div>

        {/* Filter Tabs */}
        <div className="mb-3 flex gap-1.5 border-b border-[#252a32] pb-2 font-mono text-xs [data-theme=light]:border-[#eef0f3]">
          <button
            onClick={() => setFilter("all")}
            className={`rounded px-2.5 py-1 transition-colors ${
              filter === "all"
                ? "bg-[#1f242c] font-medium text-white [data-theme=light]:bg-[#e4e9ee] [data-theme=light]:text-black"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            {format(t("settings.filterAllModels"), { count: models.length })}
          </button>
          <button
            onClick={() => setFilter("ollama")}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 transition-colors ${
              filter === "ollama"
                ? "border border-[#3F5E36] bg-[#5F7F52]/20 font-medium text-[#8DA982]"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            <HardDrive className="h-3 w-3" />
            <span>{t("settings.filterLocalOllama")}</span>
          </button>
          <button
            onClick={() => setFilter("openrouter")}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 transition-colors ${
              filter === "openrouter"
                ? "bg-[#1f242c] font-medium text-white [data-theme=light]:bg-[#e4e9ee] [data-theme=light]:text-black"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            <Cloud className="h-3 w-3" />
            <span>{t("settings.filterOpenRouterCloud")}</span>
          </button>
        </div>

        {/* Model Presets List */}
        <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
          {filteredModels.map((m) => {
            const isSelected = activeModel === m.id;
            return (
              <div
                key={m.id}
                onClick={() => selectModel(m.id, m.provider)}
                className={`group flex cursor-pointer items-start justify-between rounded border p-3 transition-all ${
                  isSelected
                    ? "border-[#5F7F52] bg-[#5F7F52]/10 shadow-[0_0_12px_rgba(95,127,82,0.15)]"
                    : "border-[#2B3037] bg-[#16191e] hover:border-[#3A414B] hover:bg-[#1b2027] [data-theme=light]:border-[#e2e4e8] [data-theme=light]:bg-[#fafbfc] [data-theme=light]:hover:bg-[#f0f3f6]"
                }`}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[var(--foreground)] transition-colors group-hover:text-[#8DA982]">
                      {m.name}
                    </span>
                    {m.badge && (
                      <span className="py-0.2 rounded border border-[#3A414B] bg-[#252a32] px-1.5 font-mono text-[10px] text-[#8DA982] [data-theme=light]:border-[#d0d7de] [data-theme=light]:bg-[#e4e9ee]">
                        {m.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">
                    {m.description}
                  </p>
                  <div className="mt-0.5 flex items-center gap-3 font-mono text-[10px] text-[#717b8a]">
                    <span>id: {m.id}</span>
                    <span>·</span>
                    <span>ctx: {m.contextWindow}</span>
                    <span>·</span>
                    <span className="font-semibold text-[#5F7F52] uppercase">
                      {m.provider}
                    </span>
                  </div>
                </div>

                <div className="flex items-center self-center pl-3">
                  {isSelected ? (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#5F7F52] text-white">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </span>
                  ) : (
                    <span className="h-4 w-4 rounded-full border border-[#3A414B] group-hover:border-[#5F7F52]" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom model input */}
        <form
          onSubmit={handleCustomSubmit}
          className="mt-4 flex gap-2 border-t border-[#252a32] pt-3 [data-theme=light]:border-[#eef0f3]"
        >
          <input
            type="text"
            placeholder={t("settings.customModelPlaceholder")}
            value={customModel}
            onChange={(e) => setCustomModel(e.target.value)}
            className="flex-1 rounded border border-[#2B3037] bg-[#0f1216] px-3 py-1.5 font-mono text-xs text-[var(--foreground)] placeholder:text-[#525a66] focus:border-[#5F7F52] focus:outline-none [data-theme=light]:border-[#d0d7de] [data-theme=light]:bg-[#f6f8fa]"
          />
          <button
            type="submit"
            disabled={!customModel.trim() || isSaving}
            className="cursor-pointer rounded border border-[#3F5E36] bg-[#5F7F52] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#729663] disabled:opacity-40"
          >
            {t("settings.apply")}
          </button>
        </form>

        {statusMessage && (
          <p className="mt-2 text-center font-mono text-xs text-[#5F7F52]">
            {statusMessage}
          </p>
        )}
      </div>
    </div>
  );
}
