import "server-only";

function readEnvValue(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

/**
 * Whether the local Ollama daemon answers, and which model is loaded.
 *
 * Ollama is a precondition, not something the app manages: if it is not
 * running the studio cannot generate, so the answer is checked rather than
 * assumed, and the status bar shows it. The probe is a plain GET /api/tags
 * against the loopback daemon with a short timeout — no model is loaded, no
 * token is spent.
 */
const PROBE_TIMEOUT_MS = 1500;

export interface OllamaAvailability {
  reachable: boolean;
  /** The model the generator would use, whether or not it is pulled. */
  model: string;
  /** True when Ollama answers but the configured model is not pulled yet. */
  modelMissing: boolean;
  /** A message safe to show a person: the base URL and the reason. */
  detail: string;
}

function ollamaBaseUrl(): string {
  // openai.ts talks to the daemon's OpenAI-compatible endpoint; /api/tags lives
  // on its native one, so the /v1 suffix is dropped.
  return (
    readEnvValue("OLLAMA_BASE_URL") ?? "http://127.0.0.1:11434/v1"
  ).replace(/\/v1\/?$/, "");
}

export async function checkOllama(): Promise<OllamaAvailability> {
  const base = ollamaBaseUrl();
  const model = readEnvValue("OLLAMA_MODEL") ?? "qwen3.6:35b-studio";

  try {
    const response = await fetch(`${base}/api/tags`, {
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!response.ok) {
      return {
        reachable: false,
        model,
        modelMissing: false,
        detail: `Ollama at ${base} answered ${response.status}.`,
      };
    }

    const body = (await response.json()) as {
      models?: { name?: string; model?: string }[];
    };
    const names = (body.models ?? []).map(
      (entry) => entry.name ?? entry.model ?? "",
    );
    // Ollama reports "qwen3.6:35b-studio" and tags as "qwen3.6:35b-studio:8b";
    // a pull is a prefix match, not equality.
    const modelMissing = !names.some((name) => name.startsWith(model));

    return {
      reachable: true,
      model,
      modelMissing,
      detail: modelMissing
        ? `Ollama at ${base} is up but ${model} is not pulled (run: ollama pull ${model}).`
        : `Ollama at ${base} is up with ${model}.`,
    };
  } catch (error) {
    return {
      reachable: false,
      model,
      modelMissing: false,
      detail: `Ollama is not answering on ${base} (${error instanceof Error ? error.message : "unknown error"}).`,
    };
  }
}
