import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface ModelPreset {
  id: string;
  name: string;
  provider: "openrouter" | "openai" | "opencode" | "ollama";
  contextWindow: string;
  badge?: string;
  description: string;
}

export const AVAILABLE_MODELS: ModelPreset[] = [
  {
    id: "qwen3.6:35b-studio",
    name: "Qwen 3.6 35B (Studio Local)",
    provider: "ollama",
    contextWindow: "8,192",
    badge: "2026 Flagship · CPU Offload",
    description:
      "Qwen 3.6 35B (2026) running locally with 8,192 context window and hybrid RTX 3070 VRAM + DDR RAM offloading.",
  },
  {
    id: "opencode-go/space-bunny-free",
    name: "OpenCode Space Bunny",
    provider: "opencode",
    contextWindow: "1,000,000",
    badge: "OpenCode CLI",
    description: "Direct invocation via your local OpenCode environment.",
  },
  {
    id: "stealth/space-bunny-alpha",
    name: "Space Bunny Alpha",
    provider: "openrouter",
    contextWindow: "1,000,000",
    badge: "Fast Cloud",
    description:
      "Ultra-fast execution with 1M token context. Excellent for massive codebases.",
  },
  {
    id: "openai/gpt-5.6-luna",
    name: "GPT-5.6 Luna",
    provider: "opencode",
    contextWindow: "922,000",
    badge: "ChatGPT Subscription",
    description:
      "Deep reasoning model accessed via OpenCode ChatGPT token sharing.",
  },
  {
    id: "nvidia/nemotron-3-ultra-550b-a55b:free",
    name: "NVIDIA Nemotron 3 Ultra",
    provider: "openrouter",
    contextWindow: "131,072",
    badge: "550B · Free",
    description:
      "Massive 550B parameter model with rigorous architectural reasoning.",
  },
  {
    id: "qwen/qwen3.8-27b:free",
    name: "Qwen 3.8 27B",
    provider: "openrouter",
    contextWindow: "262,144",
    badge: "Free Cloud",
    description:
      "Strong open-weights coding model with generous context window.",
  },
];

let runtimeModelOverride: string | null = null;
let runtimeProviderOverride: string | null = null;

export function getActiveModelConfig() {
  // ACTIVE_MODEL is the provider-agnostic key the settings dialog persists
  // (it is written to .env.local in the writable config directory and read
  // back on the next launch), so it wins over the per-provider keys.
  const model =
    runtimeModelOverride ||
    process.env.ACTIVE_MODEL ||
    process.env.OLLAMA_MODEL ||
    process.env.OPENROUTER_MODEL ||
    "qwen3.6:35b-studio";
  const provider =
    runtimeProviderOverride || process.env.AI_PROVIDER || "ollama";
  return { model, provider };
}

export async function GET() {
  const active = getActiveModelConfig();
  return NextResponse.json({
    activeModel: active.model,
    activeProvider: active.provider,
    models: AVAILABLE_MODELS,
  });
}

/** Add `key=value` to an env file, replacing any previous value for `key`. */
function upsertEnvLine(contents: string, key: string, value: string): string {
  const line = `${key}=${value}`;
  const existing = new RegExp(`^${key}=.*$`, "m");
  if (existing.test(contents)) return contents.replace(existing, line);
  const body = contents.replace(/\s*$/, "");
  return body ? `${body}\n${line}\n` : `${line}\n`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const model = body.model || body.modelId;
    const provider = body.provider;

    if (!model || typeof model !== "string") {
      return NextResponse.json(
        { error: "Invalid model identifier" },
        { status: 400 },
      );
    }

    runtimeModelOverride = model.trim();
    if (provider) {
      runtimeProviderOverride = provider;
    }

    // Persist the choice where the running app is allowed to write. The
    // packaged desktop app hands its own config directory through
    // DIAGRAM_USER_DATA (Electron's userData, writable), because the bundle it
    // runs from is read-only; with no such directory this stays the repo-local
    // development behaviour.
    try {
      const configDir = process.env.DIAGRAM_USER_DATA?.trim() || process.cwd();
      const envPath = path.join(configDir, ".env.local");
      const current = fs.existsSync(envPath)
        ? fs.readFileSync(envPath, "utf-8")
        : "";
      let envContent = upsertEnvLine(
        current,
        "ACTIVE_MODEL",
        runtimeModelOverride,
      );
      if (runtimeProviderOverride) {
        envContent = upsertEnvLine(
          envContent,
          "AI_PROVIDER",
          runtimeProviderOverride,
        );
      }
      fs.mkdirSync(configDir, { recursive: true });
      // The file holds API keys, so it is created as owner-only.
      fs.writeFileSync(envPath, envContent, { encoding: "utf-8", mode: 0o600 });
      fs.chmodSync(envPath, 0o600);
    } catch (e) {
      console.warn("Could not persist model settings:", e);
    }

    return NextResponse.json({
      success: true,
      activeModel: runtimeModelOverride,
      activeProvider: runtimeProviderOverride || "openrouter",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to update model settings" },
      { status: 500 },
    );
  }
}
