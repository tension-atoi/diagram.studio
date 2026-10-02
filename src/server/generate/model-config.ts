export type AIProvider = "openai" | "openrouter" | "ollama";
export type GenerationServiceTier = "default" | "priority";

const DEFAULT_PROVIDER: AIProvider = "ollama";
const DEFAULT_OPENAI_MODEL = "gpt-6-luna";
const DEFAULT_OPENROUTER_MODEL = "openai/gpt-5.6-terra";
const DEFAULT_OLLAMA_MODEL = "qwen3.6:35b-studio";
const MANAGED_OPENAI_MODEL_PATTERN =
  /^gpt-(?:5\.6(?:-(?:sol|terra|luna))?|6-luna)(?:-\d{4}-\d{2}-\d{2})?$/i;

function readEnvValue(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function normalizeProvider(value?: string): AIProvider {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "openrouter" || normalized === "opencode") {
    return "openrouter";
  }
  if (normalized === "ollama") {
    return "ollama";
  }
  if (normalized === "openai") {
    return "openai";
  }
  return DEFAULT_PROVIDER;
}

import { getActiveModelConfig } from "~/app/api/settings/model/route";

export function getProvider(overrideProvider?: string): AIProvider {
  const active = getActiveModelConfig();
  return normalizeProvider(
    overrideProvider ?? active.provider ?? readEnvValue("AI_PROVIDER"),
  );
}

export function getProviderLabel(provider: AIProvider): string {
  if (provider === "ollama") {
    return "Ollama (Local)";
  }
  return provider === "openrouter" ? "OpenRouter" : "OpenAI";
}

export function supportsExactInputTokenCount(provider: AIProvider): boolean {
  return provider === "openai";
}

export function supportsTextVerbosity(
  provider: AIProvider,
  model: string,
): boolean {
  return (
    provider === "openai" && MANAGED_OPENAI_MODEL_PATTERN.test(model.trim())
  );
}

/** Fast mode is funded by diagram studio, never silently charged to a user's key. */
export function getGenerationServiceTier(params: {
  provider: AIProvider;
  model: string;
  apiKey?: string;
}): GenerationServiceTier {
  return params.provider === "openai" &&
    !params.apiKey?.trim() &&
    MANAGED_OPENAI_MODEL_PATTERN.test(params.model.trim())
    ? "priority"
    : "default";
}

export function usesSinglePassArchitecture(params: {
  provider: AIProvider;
  model: string;
  apiKey?: string;
}): boolean {
  return (
    params.provider === "openai" &&
    !params.apiKey?.trim() &&
    /^gpt-(?:5\.6|6)-luna(?:-\d{4}-\d{2}-\d{2})?$/i.test(params.model.trim())
  );
}

export function shouldUseExactInputTokenCount(params: {
  provider: AIProvider;
  apiKey?: string;
}): boolean {
  return (
    supportsExactInputTokenCount(params.provider) &&
    Boolean(params.apiKey?.trim())
  );
}

export function getModel(provider = getProvider()): string {
  // The chooser's active model only overrides the model for the provider it
  // actually belongs to — an Ollama selection must not rename an OpenAI call.
  const active = getActiveModelConfig();
  if (active.model && active.provider === provider) {
    return active.model;
  }
  if (provider === "ollama") {
    return readEnvValue("OLLAMA_MODEL") ?? DEFAULT_OLLAMA_MODEL;
  }
  if (provider === "openrouter") {
    return readEnvValue("OPENROUTER_MODEL") ?? DEFAULT_OPENROUTER_MODEL;
  }

  return readEnvValue("OPENAI_MODEL") ?? DEFAULT_OPENAI_MODEL;
}
