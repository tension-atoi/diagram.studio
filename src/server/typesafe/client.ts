/* eslint-disable @typescript-eslint/no-explicit-any */
import { TypeSafeClient } from "@typesafe-ai/sdk";

let cachedClient: TypeSafeClient | null = null;
let lastApiKey: string | undefined = undefined;

/**
 * The key, from either name. Module-local: the only consumers are
 * `isTypeSafeConfigured` (what the status bar and the callers ask) and
 * `getTypeSafeClient` below.
 */
function getTypeSafeApiKey(): string | undefined {
  return (
    process.env.TYPESAFE_API_KEY?.trim() ||
    process.env.JEV_API_KEY?.trim() ||
    undefined
  );
}

export function isTypeSafeConfigured(): boolean {
  return Boolean(getTypeSafeApiKey());
}

/**
 * The cached client, or null when no key is configured. Module-local:
 * `executeSystemOneSafely` below is the only caller.
 */
function getTypeSafeClient(): TypeSafeClient | null {
  const apiKey = getTypeSafeApiKey();
  if (!apiKey) {
    return null;
  }

  if (cachedClient && lastApiKey === apiKey) {
    return cachedClient;
  }

  try {
    cachedClient = new TypeSafeClient({
      apiKey,
      timeout: 12_000,
      defaultModel: "jev-latest",
    });
    lastApiKey = apiKey;
    return cachedClient;
  } catch (error) {
    console.warn("Failed to initialize TypeSafeClient:", error);
    return null;
  }
}

export async function executeSystemOneSafely(params: {
  state: any;
  questions: any;
}): Promise<Record<string, any> | null> {
  const client = getTypeSafeClient();
  if (!client) {
    return null;
  }

  try {
    const response = await (client as any).systemOne({
      state: params.state,
      questions: params.questions,
    });
    return response?.answers || null;
  } catch (error) {
    console.warn("Jev System One execution failed gracefully:", error);
    return null;
  }
}
