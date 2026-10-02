#!/usr/bin/env node
/**
 * Stage `.next/standalone` for packaging.
 *
 * `output: "standalone"` copies the server and its traced dependencies, but
 * deliberately leaves two things behind because a normal deployment copies
 * them itself: the client bundle (`.next/static`) and everything served from
 * `public/` (the MCP app, fonts, icons). The desktop bundle is assembled from
 * this one directory, so both land here before electron-builder runs.
 */
import { access, cp, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const standalone = path.join(root, ".next", "standalone");

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

if (!(await exists(path.join(standalone, "server.js")))) {
  console.error(
    "prepare-standalone: no .next/standalone/server.js — run `bun run build:electron` first.",
  );
  process.exit(1);
}

await mkdir(path.join(standalone, ".next"), { recursive: true });
await cp(path.join(root, ".next", "static"), path.join(standalone, ".next", "static"), {
  recursive: true,
});

// `public/` is optional in principle (an empty repo would ship no static
// assets), but a missing directory here means the MCP app was never built.
if (await exists(path.join(root, "public"))) {
  await cp(path.join(root, "public"), path.join(standalone, "public"), { recursive: true });
} else {
  console.error("prepare-standalone: public/ is missing — run `bun run build` first.");
  process.exit(1);
}

console.log("prepare-standalone: staged .next/static and public/ into .next/standalone");
