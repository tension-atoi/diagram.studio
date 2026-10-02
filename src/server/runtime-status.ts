import "server-only";

import {
  checkOllama,
  type OllamaAvailability,
} from "~/server/generate/ollama-availability";
import { isTypeSafeConfigured } from "~/server/typesafe/client";

/**
 * What the status bar reports, so it can show what is actually running instead
 * of a static claim.
 *
 * The engine is a precondition that is probed; the verifier is a flag, because
 * it is only configured when a key is present — the packaged app ships without
 * one, and a badge reading "active" when nothing runs would be a lie.
 */
export interface RuntimeStatus {
  engine: OllamaAvailability;
  verifier: {
    configured: boolean;
  };
}

export async function checkRuntime(): Promise<RuntimeStatus> {
  const [engine] = await Promise.all([checkOllama()]);
  return { engine, verifier: { configured: isTypeSafeConfigured() } };
}
