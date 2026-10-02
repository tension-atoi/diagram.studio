import type { GenerationSessionAudit } from "~/features/diagram/graph";
import { getWriteLocation } from "~/server/storage/cache-key";
import { upstashCommand } from "~/server/storage/upstash";
import type {
  ArtifactVisibility,
  StoredFailureSummary,
} from "~/server/storage/types";

const STATUS_TTL_SECONDS = 3 * 24 * 60 * 60;

/**
 * Where a failed generation is recorded so the repository page can show it
 * again on the next visit: a slim summary in Redis, keyed per visibility,
 * expiring in three days.
 *
 * Writing and clearing are the only operations: the read path lives in the
 * diagram page, which in this local-first build answers from the on-disk cache
 * instead. The hosted read comes back with the hosted storage.
 */
export async function writeFailureSummary(params: {
  username: string;
  repo: string;
  githubPat?: string;
  visibility: ArtifactVisibility;
  latestSessionSummary: GenerationSessionAudit;
}): Promise<void> {
  const location = getWriteLocation(params);

  const summary: StoredFailureSummary = {
    version: 1,
    visibility: params.visibility,
    username: params.username,
    repo: params.repo,
    latestSessionSummary: params.latestSessionSummary,
  };

  await upstashCommand([
    "SET",
    location.statusKey,
    JSON.stringify(summary),
    "EX",
    STATUS_TTL_SECONDS,
  ]);
}

export async function clearFailureSummary(params: {
  username: string;
  repo: string;
  githubPat?: string;
  visibility: ArtifactVisibility;
}): Promise<void> {
  const location = getWriteLocation(params);

  await upstashCommand(["DEL", location.statusKey]);
}
