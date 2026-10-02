#!/usr/bin/env node
/**
 * One command for the desktop dev loop: MCP app → `next dev` → Electron.
 *
 * The dev server owns the port here, so the first-launch port dialog is
 * skipped (Electron only ever shows it for the packaged app); the URL is
 * handed to Electron through ELECTRON_DEV_URL.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_PORT = 7421;
const START_TIMEOUT_MS = 120_000;

/** Dev follows the port the packaged app was configured with, if any. */
function resolvePort() {
  const fromEnv = Number(process.env.DIAGRAM_PORT);
  if (Number.isInteger(fromEnv) && fromEnv > 0) return fromEnv;
  const configPath = path.join(
    os.homedir(),
    ".config",
    "gnu-in-labs-diagram-studio",
    "config.json",
  );
  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    if (Number.isInteger(config.port) && config.port > 0) return config.port;
  } catch {
    // First launch: fall through to the default port.
  }
  return DEFAULT_PORT;
}

function probe(url) {
  return new Promise((resolve) => {
    const request = http.get(url, (response) => {
      response.resume();
      resolve(response.statusCode > 0);
    });
    request.setTimeout(2000, () => {
      request.destroy();
      resolve(false);
    });
    request.on("error", () => resolve(false));
  });
}

async function waitFor(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await probe(url)) return true;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

const port = resolvePort();
const url = `http://127.0.0.1:${port}`;
const children = [];
let exiting = false;

function shutdown(code) {
  if (exiting) return;
  exiting = true;
  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) {
      try {
        child.kill("SIGTERM");
      } catch {
        // Already gone.
      }
    }
  }
  process.exitCode = code;
}

console.log(`[electron:dev] building the MCP app…`);
const mcp = spawnSync("bun", ["run", "build:mcp-app"], { cwd: root, stdio: "inherit" });
if (mcp.status !== 0) process.exit(mcp.status ?? 1);

console.log(`[electron:dev] next dev → ${url}`);
// The same wrapper `bun run dev` uses: it restores the terminal's line editing
// and bracketed paste when Next exits or is interrupted.
const devServer = spawn("bash", ["scripts/dev-turbo.sh", "--port", String(port)], {
  cwd: root,
  stdio: "inherit",
});
children.push(devServer);

const ready = await waitFor(url, START_TIMEOUT_MS);
if (!ready) {
  console.error(`[electron:dev] ${url} did not answer within ${START_TIMEOUT_MS / 1000}s`);
  shutdown(1);
} else {
  console.log(`[electron:dev] launching Electron against ${url}`);
  const electron = spawn("electron", ["."], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, ELECTRON_DEV_URL: url },
  });
  children.push(electron);

  electron.on("exit", (code) => shutdown(code ?? 0));
  devServer.on("exit", (code, signal) => {
    if (!exiting) {
      console.error(`[electron:dev] dev server exited (code=${code} signal=${signal})`);
      shutdown(code ?? 1);
    }
  });
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => shutdown(130));
}
