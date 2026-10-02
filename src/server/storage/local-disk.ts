/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

/** Exported so the test global-setup wipes the same directory it writes to. */
export const CACHE_ROOT =
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

export function listLocalDiagrams(): Array<{
  username: string;
  repo: string;
  lastSuccessfulAt: string;
  stargazerCount: number | null;
}> {
  try {
    if (!fs.existsSync(CACHE_ROOT)) {
      return [];
    }
    const results: Array<{
      username: string;
      repo: string;
      lastSuccessfulAt: string;
      stargazerCount: number | null;
    }> = [];
    const users = fs.readdirSync(CACHE_ROOT);
    for (const user of users) {
      const userPath = path.join(CACHE_ROOT, user);
      if (!fs.statSync(userPath).isDirectory()) continue;
      const repos = fs.readdirSync(userPath);
      for (const repoFile of repos) {
        if (!repoFile.endsWith(".json")) continue;
        const repoName = repoFile.slice(0, -5);
        const fullPath = path.join(userPath, repoFile);
        const stat = fs.statSync(fullPath);
        results.push({
          username: user,
          repo: repoName,
          lastSuccessfulAt: stat.mtime.toISOString(),
          stargazerCount: null,
        });
      }
    }
    return results.sort((a, b) =>
      b.lastSuccessfulAt.localeCompare(a.lastSuccessfulAt),
    );
  } catch (err) {
    console.warn("Failed to list local diagrams:", err);
    return [];
  }
}
