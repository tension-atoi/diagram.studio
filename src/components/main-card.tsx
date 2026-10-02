"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Terminal, FolderGit2, History } from "lucide-react";
import { parseGitHubRepoUrl } from "~/features/diagram/github-url";
import {
  clearRecentDiagrams,
  useRecentDiagrams,
} from "~/features/recent/recent-diagrams";
import { captureAnalyticsEvent } from "~/lib/analytics-client";
import { useStudioLanguage } from "~/components/studio-language-provider";
import type { MessageKey } from "~/lib/i18n";

const LOCAL_PRESETS: readonly {
  label: string;
  path: string;
  noteKey: MessageKey;
}[] = [
  {
    label: "gnosix",
    path: "/tension-atoi/gnosix",
    noteKey: "mainCard.presetWaylandGpu",
  },
  {
    label: "gnosis.os",
    path: "/tension-atoi/gnosis.os",
    noteKey: "mainCard.presetCognitiveOs",
  },
  {
    label: "flask",
    path: "/pallets/flask",
    noteKey: "mainCard.presetPythonWsgi",
  },
];

export default function MainCard(_props?: { sponsor?: boolean }) {
  const [repoUrl, setRepoUrl] = useState("");
  const recent = useRecentDiagrams();
  const [error, setError] = useState("");
  const router = useRouter();
  const { t } = useStudioLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const input = repoUrl.trim();

    // Check if it's a known shortname
    if (input === "gnosix") {
      router.push("/tension-atoi/gnosix");
      return;
    }
    if (input === "gnosis.os" || input === "gnosis") {
      router.push("/tension-atoi/gnosis.os");
      return;
    }
    if (input === "flask") {
      router.push("/pallets/flask");
      return;
    }

    const parsed = parseGitHubRepoUrl(input);
    if (!parsed) {
      // If it looks like owner/repo
      const parts = input.replace(/^https?:\/\/[^\/]+\//, "").split("/");
      if (parts.length >= 2 && parts[0] && parts[1]) {
        router.push(
          `/${encodeURIComponent(parts[0])}/${encodeURIComponent(parts[1])}`,
        );
        return;
      }
      setError(t("mainCard.invalidRepository"));
      return;
    }

    const { username, repo } = parsed;
    router.push(`/${encodeURIComponent(username)}/${encodeURIComponent(repo)}`);
  };

  const handlePresetClick = (path: string, e: React.MouseEvent) => {
    e.preventDefault();
    router.push(path);
  };

  return (
    <div className="relative w-full max-w-3xl rounded-lg border border-[var(--border)] bg-[#14171c] p-6 font-sans text-[var(--foreground)] shadow-2xl transition-colors duration-150 sm:p-8 [data-theme=light]:border-[#e2e4e8] [data-theme=light]:bg-white">
      {/* Console Bar Header */}
      <div className="mb-5 flex items-center justify-between border-b border-[#252a32] pb-3 font-mono text-xs text-[#828c9b] [data-theme=light]:border-[#eef0f3]">
        <div className="flex items-center gap-2 text-[var(--foreground)]">
          <Terminal className="h-4 w-4 text-[#5F7F52]" />
          <span className="font-semibold tracking-wide">
            {t("mainCard.ingestionTitle")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#5F7F52]" />
          <span className="text-[11px] font-semibold text-[#5F7F52] uppercase">
            {t("mainCard.offlineCacheReady")}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <span className="absolute top-1/2 left-3.5 -translate-y-1/2 font-mono text-sm text-[#5F7F52]">
              &gt;_
            </span>
            <input
              id="repository-input"
              type="text"
              aria-label={t("mainCard.repositoryLabel")}
              placeholder={t("mainCard.repositoryPlaceholder")}
              className="w-full rounded border border-[#2B3037] bg-[#0f1216] py-3 pr-4 pl-9 font-mono text-sm text-[var(--foreground)] transition-colors placeholder:text-[#525a66] focus:border-[#5F7F52] focus:outline-none sm:text-base [data-theme=light]:border-[#d0d7de] [data-theme=light]:bg-[#f6f8fa]"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              aria-describedby={error ? "repository-input-error" : undefined}
              aria-invalid={Boolean(error)}
              required
            />
          </div>

          <button
            type="submit"
            className="flex cursor-pointer items-center justify-center gap-2 rounded border border-[#3F5E36] bg-[#5F7F52] px-6 py-3 text-sm font-semibold text-white shadow-[0_2px_10px_rgba(95,127,82,0.25)] transition-all hover:bg-[#729663]"
          >
            <span>{t("mainCard.submit")}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <p
            id="repository-input-error"
            role="alert"
            className="flex items-center gap-1.5 pt-1 font-mono text-xs text-[#E5484D]"
          >
            <span aria-hidden="true">●</span> {error}
          </p>
        )}
      </form>

      {/* Preset / Local Targets */}
      <div className="mt-6 border-t border-[#252a32] pt-5 [data-theme=light]:border-[#eef0f3]">
        <p className="mb-2.5 flex items-center gap-1.5 font-mono text-xs text-[#828c9b]">
          <FolderGit2 className="h-3.5 w-3.5 text-[#5F7F52]" />
          <span>{t("mainCard.localTargets")}</span>
        </p>

        <div className="flex flex-wrap gap-2">
          {LOCAL_PRESETS.map((preset) => (
            <button
              key={preset.path}
              type="button"
              onClick={(e) => handlePresetClick(preset.path, e)}
              className="group flex cursor-pointer items-center gap-2 rounded border border-[#2B3037] bg-[#1a1e24] px-3 py-1.5 font-mono text-xs text-[var(--foreground)] transition-all hover:border-[#5F7F52] hover:bg-[#20252d] hover:text-[#8DA982] [data-theme=light]:border-[#d0d7de] [data-theme=light]:bg-[#f0f3f6] [data-theme=light]:hover:bg-[#e4e9ee]"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#5F7F52]" />
              <span className="font-medium">{preset.label}</span>
              <span className="text-[10px] text-[#717b8a] group-hover:text-[#8DA982]">
                ({t(preset.noteKey)})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Repositories */}
      {recent.length > 0 && (
        <div className="mt-5 border-t border-[#252a32] pt-4 [data-theme=light]:border-[#eef0f3]">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-mono text-xs text-[#828c9b]">
              <History className="h-3.5 w-3.5 text-[#5F7F52]" />
              <span>{t("mainCard.recentlyInspected")}</span>
            </span>
            <button
              type="button"
              onClick={clearRecentDiagrams}
              className="font-mono text-[11px] text-[#717b8a] transition-colors hover:text-[#E5484D]"
            >
              {t("mainCard.clearHistory")}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {recent.slice(0, 5).map((r, index) => (
              <button
                key={`${r.owner}/${r.repo}`}
                type="button"
                title={`${r.owner}/${r.repo}`}
                onClick={(e) => {
                  captureAnalyticsEvent("recent_diagram_clicked", {
                    repository: `${r.owner}/${r.repo}`,
                    position: index,
                  });
                  handlePresetClick(`/${r.owner}/${r.repo}`, e);
                }}
                className="cursor-pointer rounded border border-[#2B3037] bg-[#181c22] px-2.5 py-1 font-mono text-xs text-[#a0aab8] transition-colors hover:border-[#3A414B] hover:text-white [data-theme=light]:border-[#d0d7de] [data-theme=light]:bg-[#f6f8fa] [data-theme=light]:text-[#333]"
              >
                {r.owner}/{r.repo}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
