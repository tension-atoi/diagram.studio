import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";

import { CACHE_ROOT } from "~/server/storage/local-disk";

/**
 * Every run starts from an empty local cache.
 *
 * `local-disk.ts` routes the test environment here, but files written by one
 * run survive it and leak into the next: a stale `acme/demo.json` made page
 * tests read real cached data instead of their mocks, moving an identical
 * suite from 19 to 30 failures between runs.
 *
 * The tmpdir guard is load-bearing — it turns "NODE_ENV was not 'test' in the
 * setup process" from a wipe of ~/.cache/gnu-in-labs-diagram-studio into a failed run.
 */
export default async function resetTestCache(): Promise<void> {
  if (!CACHE_ROOT.startsWith(tmpdir())) {
    throw new Error(
      `Refusing to wipe non-temporary cache root: ${CACHE_ROOT} ` +
        `(NODE_ENV=${process.env.NODE_ENV ?? "unset"}).`,
    );
  }

  await rm(CACHE_ROOT, { recursive: true, force: true });
}
