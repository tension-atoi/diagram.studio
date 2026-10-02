import type {
  DiagramGraph,
  GenerationSessionAudit,
} from "~/features/diagram/graph";
import {
  getStoredDiagramState,
  toStoredSessionSummary,
  updateArtifactLatestSessionSummary,
  writeDiagramArtifact,
} from "~/server/storage/artifact-store";
import {
  clearFailureSummary,
  writeFailureSummary,
} from "~/server/storage/status-store";
import { upsertBrowseIndexEntry } from "~/server/storage/browse-diagrams";
import type { ArtifactVisibility } from "~/server/storage/types";
import {
  readLocalDiagram,
  saveLocalDiagram,
} from "~/server/storage/local-disk";

export interface DiagramStateRecord {
  diagram: string | null;
  explanation: string | null;
  graph: DiagramGraph | null;
  latestSessionAudit: GenerationSessionAudit | null;
  lastSuccessfulAt: string | null;
}

function inferVisibility(params: {
  visibility?: ArtifactVisibility;
  githubPat?: string;
}): ArtifactVisibility {
  return params.visibility ?? (params.githubPat?.trim() ? "private" : "public");
}

export async function getDiagramStateRecord(
  username: string,
  repo: string,
  githubPat?: string,
): Promise<DiagramStateRecord> {
  const localCached = readLocalDiagram(username, repo);
  if (localCached && localCached.diagram) {
    return {
      diagram: localCached.diagram,
      explanation: localCached.explanation ?? null,
      graph: localCached.graph ?? null,
      latestSessionAudit: localCached.latestSessionSummary ?? null,
      lastSuccessfulAt:
        localCached.lastSuccessfulAt ?? localCached.generatedAt ?? null,
    };
  }

  try {
    const storedArtifactState = await getStoredDiagramState({
      username,
      repo,
      githubPat,
    });
    if (storedArtifactState) {
      return storedArtifactState;
    }
  } catch {
    // Ignore remote storage failure in local mode
  }

  return {
    diagram: null,
    explanation: null,
    graph: null,
    latestSessionAudit: null,
    lastSuccessfulAt: null,
  };
}

export async function persistTerminalSessionAudit(params: {
  username: string;
  repo: string;
  githubPat?: string;
  visibility?: ArtifactVisibility;
  audit: GenerationSessionAudit;
}) {
  if (params.audit.status !== "failed" && params.audit.status !== "succeeded") {
    return;
  }

  const visibility = inferVisibility(params);
  const slimAudit = toStoredSessionSummary(params.audit);
  const artifactUpdated = await updateArtifactLatestSessionSummary({
    username: params.username,
    repo: params.repo,
    githubPat: params.githubPat,
    visibility,
    latestSessionSummary: slimAudit,
  });

  if (!artifactUpdated && params.audit.status === "failed") {
    await writeFailureSummary({
      username: params.username,
      repo: params.repo,
      githubPat: params.githubPat,
      visibility,
      latestSessionSummary: slimAudit,
    });
    return;
  }

  if (artifactUpdated || params.audit.status === "succeeded") {
    await clearFailureSummary({
      username: params.username,
      repo: params.repo,
      githubPat: params.githubPat,
      visibility,
    });
  }
}

export async function saveSuccessfulDiagramState(params: {
  username: string;
  repo: string;
  githubPat?: string;
  visibility: ArtifactVisibility;
  stargazerCount: number | null;
  explanation: string;
  graph: DiagramGraph;
  diagram: string;
  audit: GenerationSessionAudit;
  usedOwnKey: boolean;
}) {
  const successfulAt = params.audit.updatedAt || new Date().toISOString();

  saveLocalDiagram(params.username, params.repo, {
    visibility: params.visibility,
    username: params.username,
    repo: params.repo,
    stargazerCount: params.stargazerCount,
    diagram: params.diagram,
    explanation: params.explanation,
    graph: params.graph,
    generatedAt: successfulAt,
    usedOwnKey: params.usedOwnKey,
    latestSessionSummary: toStoredSessionSummary(params.audit),
    lastSuccessfulAt: successfulAt,
  });

  try {
    await writeDiagramArtifact({
      username: params.username,
      repo: params.repo,
      githubPat: params.githubPat,
      visibility: params.visibility,
      stargazerCount: params.stargazerCount,
      diagram: params.diagram,
      explanation: params.explanation,
      graph: params.graph,
      generatedAt: successfulAt,
      usedOwnKey: params.usedOwnKey,
      latestSessionSummary: toStoredSessionSummary(params.audit),
      lastSuccessfulAt: successfulAt,
    });
  } catch {
    // Ignore remote artifact write failure in local mode
  }

  return true;
}

export async function clearSuccessfulDiagramFailureSummary(params: {
  username: string;
  repo: string;
  githubPat?: string;
  visibility: ArtifactVisibility;
}): Promise<void> {
  await clearFailureSummary(params);
}

export async function updatePublicBrowseIndexForSuccessfulDiagram(params: {
  username: string;
  repo: string;
  lastSuccessfulAt: string;
  stargazerCount: number | null;
}) {
  await upsertBrowseIndexEntry({
    username: params.username,
    repo: params.repo,
    lastSuccessfulAt: params.lastSuccessfulAt,
    stargazerCount: params.stargazerCount,
  });
}
