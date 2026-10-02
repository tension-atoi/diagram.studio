"use client";

import type { GenerationCostSummary } from "~/features/diagram/cost";
import type { JevAuditMetadata } from "~/features/diagram/types";
import { useHydrated } from "~/hooks/use-hydrated";
import styles from "./workspace.module.css";

const generatedTimeFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

// The browser's timezone is only known after hydration. Keep the server's
// reserved date space empty, then reveal the final local value once.
function localGeneratedTime(date: Date) {
  return generatedTimeFormatter.format(date);
}

export function DiagramMetadata({
  lastGenerated,
  cost,
  jevAudit,
}: {
  lastGenerated?: Date;
  cost?: GenerationCostSummary;
  jevAudit?: JevAuditMetadata;
}) {
  const hydrated = useHydrated();
  if (!lastGenerated && !cost && !jevAudit) return null;
  return (
    <div className={styles.resultMetadata}>
      {jevAudit && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
          <span className="font-mono">⚡ JEV AUDITED</span>
          <span className="text-zinc-500">·</span>
          <span>Health: {jevAudit.healthScore}%</span>
          <span className="text-zinc-500">·</span>
          <span>
            {jevAudit.verifiedEdgesCount} verified / {jevAudit.prunedEdgesCount}{" "}
            pruned
          </span>
        </span>
      )}
      {lastGenerated && (
        <span
          className={styles.generatedTime}
          data-hydrated={hydrated}
          aria-hidden={!hydrated}
        >
          Generated{" "}
          <time
            dateTime={lastGenerated.toISOString()}
            title={lastGenerated.toISOString()}
          >
            {hydrated ? localGeneratedTime(lastGenerated) : null}
          </time>
        </span>
      )}
      {cost && (
        <span>
          {cost.kind === "actual" ? "Actual" : "Estimated"} cost: {cost.display}
        </span>
      )}
    </div>
  );
}
