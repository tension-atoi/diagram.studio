"use client";

import { useState, type RefObject } from "react";
import {
  ChevronDown,
  Clapperboard,
  RotateCcw,
  Scan,
  Trash2,
  Code2,
  Check,
  ExternalLink,
} from "lucide-react";
import type { JevAuditMetadata } from "~/features/diagram/types";
import { DiagramExport } from "./diagram-export";
import { NewBadge } from "~/components/new-badge";
import { useStudioLanguage } from "~/components/studio-language-provider";
import { format } from "~/lib/i18n";
import styles from "./workspace.module.css";

export function RepositoryToolbar({
  repository,
  diagram,
  historyId,
  historyVisible,
  toggleHistory,
  zooming,
  toggleZoom,
  onRegenerate,
  regenerateDisabled,
  regenerateRef,
  getSvg,
  pending,
  video,
  readme,
  jevAudit,
}: {
  repository: string;
  diagram: string;
  historyId: string;
  historyVisible: boolean;
  toggleHistory: () => void;
  zooming: boolean;
  toggleZoom: () => void;
  onRegenerate: () => void;
  regenerateDisabled: boolean;
  regenerateRef: RefObject<HTMLButtonElement | null>;
  getSvg: () => SVGSVGElement | null;
  pending: boolean;
  video?: { id: string; open: boolean; toggle: () => void };
  readme?: { owner: string; repo: string };
  jevAudit?: JevAuditMetadata;
}) {
  const [isCopied, setIsCopied] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const { t } = useStudioLanguage();

  const handleCopyCode = async () => {
    if (!diagram) return;
    try {
      await navigator.clipboard.writeText(diagram);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handlePurgeCache = async () => {
    const parts = repository.split("/");
    if (parts.length < 2) return;
    setIsPurging(true);
    try {
      await fetch("/api/cache/purge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: parts[0], repo: parts[1] }),
      });
      onRegenerate();
    } catch (e) {
      console.warn("Failed to purge cache:", e);
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className={styles.resultToolbar}>
      {/* Codebase Identifier: the repository name itself is the direct link
          to GitHub (the ⬡ marker stays decorative for screen readers). */}
      <h1 className={styles.repositoryTitle}>
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="flex h-6 w-6 items-center justify-center rounded border border-[#3F5E36] bg-[#5F7F52]/20 font-mono text-xs font-semibold text-[#8DA982]"
          >
            ⬡
          </span>
          <a
            href={`https://github.com/${repository}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 font-mono text-sm font-semibold tracking-wide text-[var(--ink)] transition-colors hover:text-[#8DA982]"
            title={t("toolbar.openInGitHub")}
          >
            {repository}
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
          {jevAudit && (
            <span
              className="ml-1 inline-flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-amber-400"
              title={format(t("toolbar.jevAuditTitle"), {
                style: jevAudit.archStyle,
                verified: jevAudit.verifiedEdgesCount,
                pruned: jevAudit.prunedEdgesCount,
              })}
            >
              <span>{t("toolbar.jevAudited")}</span>
              <span className="text-zinc-500">·</span>
              <span>{jevAudit.healthScore}%</span>
            </span>
          )}
        </div>
      </h1>

      {/* Action Controls */}
      <div className={styles.actions}>
        {/* The explainer video folds in below the toolbar; the diagram stays
            the default view, so this toggle only opens the panel on request. */}
        {video && (
          <button
            type="button"
            className={`${styles.actionButton} ${styles.primary} ${styles.videoToggle}`}
            aria-expanded={video.open}
            aria-controls={video.id}
            onClick={video.toggle}
          >
            <Clapperboard size={14} aria-hidden="true" />
            {t("toolbar.video")}
            <NewBadge className="new-badge-light" />
          </button>
        )}

        {/* Info Toggle */}
        <button
          type="button"
          className={styles.actionButton}
          disabled={pending}
          aria-expanded={historyVisible}
          aria-controls={historyId}
          onClick={toggleHistory}
        >
          {t("toolbar.info")} <ChevronDown size={12} aria-hidden="true" />
        </button>

        {/* Zoom */}
        <button
          type="button"
          className={styles.actionButton}
          disabled={pending}
          aria-pressed={zooming}
          onClick={toggleZoom}
        >
          <Scan size={14} aria-hidden="true" />
          {zooming ? t("toolbar.exitZoom") : t("toolbar.zoom")}
        </button>

        {/* On phones the actions sit in two columns; Export lands in the left
            one on its own, and the Video button ahead of it pushes Export into
            the right one, so its menu opens toward the left. */}
        <div
          className={styles.exportSlot}
          data-column={video ? "right" : "left"}
        >
          <DiagramExport
            repository={repository}
            diagram={diagram}
            getSvg={getSvg}
            disabled={pending}
            readme={readme}
          />
        </div>

        {/* Copy MMD */}
        <button
          type="button"
          className={styles.actionButton}
          disabled={!diagram || pending}
          onClick={handleCopyCode}
          title={t("toolbar.copyCodeTitle")}
        >
          {isCopied ? (
            <>
              <Check size={13} className="text-[#5F7F52]" />
              <span className="text-[#5F7F52]">{t("toolbar.copied")}</span>
            </>
          ) : (
            <>
              <Code2 size={13} />
              <span>{t("toolbar.copyMmd")}</span>
            </>
          )}
        </button>

        {/* Purge Cache Button */}
        <button
          type="button"
          className={styles.actionButton}
          disabled={pending || isPurging}
          onClick={handlePurgeCache}
          title={t("toolbar.purgeCacheTitle")}
        >
          <Trash2 size={13} />
          <span>
            {isPurging ? t("toolbar.purging") : t("toolbar.clearCache")}
          </span>
        </button>

        {/* Regenerate Button */}
        <button
          ref={regenerateRef}
          type="button"
          className={`${styles.actionButton} ${styles.primary}`}
          disabled={regenerateDisabled || pending}
          onClick={onRegenerate}
        >
          <RotateCcw size={13} aria-hidden="true" />
          <span>
            {pending ? t("toolbar.analyzing") : t("toolbar.regenerate")}
          </span>
        </button>
      </div>
    </div>
  );
}
