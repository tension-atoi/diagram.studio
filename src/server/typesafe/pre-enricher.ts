/* eslint-disable @typescript-eslint/no-explicit-any */
import { choice, noul, score } from "@typesafe-ai/sdk";
import { executeSystemOneSafely, isTypeSafeConfigured } from "./client";

export interface JevPreEnrichment {
  archStyle: string;
  archStyleConfidence: number;
  apiParadigm: string;
  isMonorepo: boolean;
  monorepoProbability: number;
  modularityScore: number;
  healthScore: number;
  summaryGuidance: string;
}

export async function runJevPreEnrichment(params: {
  repoName: string;
  filePaths: string[];
  manifestText?: string;
  readmeExcerpt?: string;
}): Promise<JevPreEnrichment | null> {
  if (!isTypeSafeConfigured()) {
    return null;
  }

  const samplePaths = params.filePaths.slice(0, 60);

  const state = {
    repo: params.repoName,
    samplePaths,
    manifest: params.manifestText?.slice(0, 2000) || "None",
    readme: params.readmeExcerpt?.slice(0, 1500) || "None",
  };

  const questions = {
    arch_style: choice(
      "What is the predominant architectural pattern of this repository?",
      {
        clean_architecture:
          "Explicit separation of domain, use-cases, and interface adapters",
        modular_monolith:
          "Single repository structured into isolated, cohesive domain modules",
        layered_mvc: "Traditional controller, service, data access layers",
        event_driven: "Message brokers, reactive pipelines, event streams",
        cli_tooling:
          "Command-line tool, script suite, or single-purpose runtime",
      },
    ),
    api_paradigm: choice(
      "What is the primary communication or API transport paradigm?",
      {
        next_actions: "Next.js App Router Server Actions and route handlers",
        trpc: "End-to-end typed tRPC procedures",
        rest: "Standard RESTful HTTP endpoints",
        graphql: "GraphQL schema and resolvers",
        native_ipc: "Unix sockets, Wayland layer-shell, D-Bus, or native IPC",
        none: "Standalone library or UI component package without server endpoints",
      },
    ),
    is_monorepo: noul(
      "Does this repository utilize a monorepo workspace configuration (pnpm, turbo, cargo workspaces)?",
    ),
    modularity: score(
      "How well are module boundaries and separation of concerns maintained?",
      [
        "Tightly coupled files with unstructured cross-imports",
        "Basic directory separation with leaky boundaries",
        "Decoupled feature directories with clear interface boundaries",
        "Strict architectural inversion with completely isolated packages",
      ],
    ),
  };

  const answers = await executeSystemOneSafely({ state, questions });
  if (!answers) {
    return null;
  }

  const anyAnswers = answers as any;
  const archStyle = anyAnswers.arch_style?.choice || "modular_monolith";
  const archStyleConfidence = anyAnswers.arch_style?.confidence ?? 0.8;
  const apiParadigm = anyAnswers.api_paradigm?.choice || "rest";
  const isMonorepo = (anyAnswers.is_monorepo?.noul ?? 0) > 0.65;
  const monorepoProbability = anyAnswers.is_monorepo?.noul ?? 0;
  const modularityRaw = anyAnswers.modularity?.score ?? 2;

  // Composite health score (0 - 100)
  const healthScore = Math.min(
    100,
    Math.max(
      10,
      Math.round((modularityRaw / 3) * 65 + archStyleConfidence * 35),
    ),
  );

  const summaryGuidance = `[JEV GROUNDING] Architectural Pattern: ${archStyle} (${Math.round(archStyleConfidence * 100)}% conf) | API: ${apiParadigm} | Monorepo: ${isMonorepo ? "yes" : "no"} | Modularity Index: ${modularityRaw.toFixed(1)}/3`;

  return {
    archStyle,
    archStyleConfidence,
    apiParadigm,
    isMonorepo,
    monorepoProbability,
    modularityScore: modularityRaw,
    healthScore,
    summaryGuidance,
  };
}
