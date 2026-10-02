/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

/** Exported so the test global-setup wipes the same directory it writes to. */
export const CACHE_ROOT =
  // Kept under its old name so existing setups keep working; it is a
  // public configuration key, not branding.
  process.env.GITDIAGRAM_CACHE_DIR ||
  (process.env.NODE_ENV === "test"
    ? path.join(os.tmpdir(), "gnu-in-labs-diagram-studio-test-cache")
    : path.join(os.homedir(), ".cache", "gnu-in-labs-diagram-studio"));

function getFilePath(username: string, repo: string): string {
  const safeUser = username.toLowerCase().replace(/[^a-z0-9._-]/g, "_");
  const safeRepo = repo.toLowerCase().replace(/[^a-z0-9._-]/g, "_");
  return path.join(CACHE_ROOT, safeUser, `${safeRepo}.json`);
}

export interface CachedDiagramRecord {
  diagram?: string;
  explanation?: string;
  graph?: any;
  latestSessionSummary?: any;
  lastSuccessfulAt?: string;
  generatedAt?: string;
  updatedAt?: string;
  visibility?: "public" | "private";
  [key: string]: any;
}

export function readLocalDiagram(
  username: string,
  repo: string,
): CachedDiagramRecord | null {
  try {
    const file = getFilePath(username, repo);
    if (!fs.existsSync(file)) {
      return null;
    }
    const data = fs.readFileSync(file, "utf-8");
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function saveLocalDiagram(
  username: string,
  repo: string,
  data: any,
): boolean {
  try {
    const file = getFilePath(username, repo);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.warn("Failed to write diagram to local disk cache:", err);
    return false;
  }
}

/** One entry of the local library: enough to list it, not to render it. */
export interface LocalDiagramEntry {
  username: string;
  repo: string;
  /** When the stored diagram was made, from the file itself. */
  lastSuccessfulAt: string | null;
  visibility: "public" | "private" | null;
}

/**
 * Every diagram this machine has stored, newest first.
 *
 * The directory is the only index there is: there is no database and no remote
 * catalogue, so a name that cannot be a GitHub path is skipped rather than
 * guessed at. A file that cannot be read is left out of the listing entirely.
 */
export function listLocalDiagrams(): LocalDiagramEntry[] {
  const entries: LocalDiagramEntry[] = [];
  let owners: string[];
  try {
    if (!fs.existsSync(CACHE_ROOT)) return [];
    owners = fs.readdirSync(CACHE_ROOT);
  } catch (err) {
    console.warn("Failed to list the local diagram cache:", err);
    return [];
  }

  for (const owner of owners) {
    if (!/^[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$/.test(owner)) continue;
    const ownerPath = path.join(CACHE_ROOT, owner);
    try {
      if (!fs.statSync(ownerPath).isDirectory()) continue;
      for (const file of fs.readdirSync(ownerPath)) {
        if (!file.endsWith(".json")) continue;
        const repo = file.slice(0, -".json".length);
        if (!/^[a-z0-9._-]{1,100}$/.test(repo)) continue;
        const fullPath = path.join(ownerPath, file);
        // A directory called `something.json` is not a diagram.
        if (!fs.statSync(fullPath).isFile()) continue;
        entries.push({
          username: owner,
          repo,
          lastSuccessfulAt: fs.statSync(fullPath).mtime.toISOString(),
          visibility: readVisibility(fullPath),
        });
      }
    } catch (err) {
      console.warn(`Failed to read the local diagram cache for ${owner}:`, err);
    }
  }

  return entries.sort((a, b) =>
    (b.lastSuccessfulAt ?? "").localeCompare(a.lastSuccessfulAt ?? ""),
  );
}

function readVisibility(file: string): LocalDiagramEntry["visibility"] {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf-8")) as {
      visibility?: unknown;
    };
    return parsed.visibility === "public" || parsed.visibility === "private"
      ? parsed.visibility
      : null;
  } catch {
    return null;
  }
}
