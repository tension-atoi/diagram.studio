import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

import { DEFAULT_LANG, isLang, type Lang } from "~/lib/i18n";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let runtimeLangOverride: Lang | null = null;

/**
 * The live choice wins over the persisted one: POST updates this process
 * immediately, while APP_LANG (read back from .env.local on the next launch)
 * covers the restarts.
 */
export function getActiveLang(): Lang {
  if (runtimeLangOverride) return runtimeLangOverride;
  const fromEnv = process.env.APP_LANG?.trim();
  return isLang(fromEnv) ? fromEnv : DEFAULT_LANG;
}

/** Add `key=value` to an env file, replacing any previous value for `key`. */
function upsertEnvLine(contents: string, key: string, value: string): string {
  const line = `${key}=${value}`;
  const existing = new RegExp(`^${key}=.*$`, "m");
  if (existing.test(contents)) return contents.replace(existing, line);
  const body = contents.replace(/\s*$/, "");
  return body ? `${body}\n${line}\n` : `${line}\n`;
}

export async function GET() {
  return NextResponse.json({ lang: getActiveLang() });
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const lang =
    typeof payload === "object" && payload !== null
      ? (payload as { lang?: unknown }).lang
      : undefined;

  if (!isLang(lang)) {
    return NextResponse.json(
      { error: "Unsupported language" },
      { status: 400 },
    );
  }

  runtimeLangOverride = lang;

  // Persist the choice where the running app is allowed to write. The packaged
  // desktop app hands its own config directory through DIAGRAM_USER_DATA
  // (Electron's userData, writable), because the bundle it runs from is
  // read-only; with no such directory this stays the repo-local development
  // behaviour.
  try {
    const configDir = process.env.DIAGRAM_USER_DATA?.trim() || process.cwd();
    const envPath = path.join(configDir, ".env.local");
    const current = fs.existsSync(envPath)
      ? fs.readFileSync(envPath, "utf-8")
      : "";
    // Upsert APP_LANG only: the same file holds the API keys, and no other key
    // may be rewritten or dropped.
    const envContent = upsertEnvLine(current, "APP_LANG", lang);
    fs.mkdirSync(configDir, { recursive: true });
    // The file holds API keys, so it is created as owner-only.
    fs.writeFileSync(envPath, envContent, { encoding: "utf-8", mode: 0o600 });
    fs.chmodSync(envPath, 0o600);
  } catch (e) {
    console.warn("Could not persist language setting:", e);
  }

  return NextResponse.json({ success: true, lang });
}
