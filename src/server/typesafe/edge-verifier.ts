/* eslint-disable @typescript-eslint/no-explicit-any */
import { choice } from "@typesafe-ai/sdk";
import { executeSystemOneSafely, isTypeSafeConfigured } from "./client";

export interface JevEdgeVerificationResult {
  mermaid: string;
  verifiedEdgesCount: number;
  prunedEdgesCount: number;
  confidenceAvg: number;
}

interface ParsedEdge {
  originalLine: string;
  source: string;
  target: string;
  operator: string;
  label?: string;
}

export async function runJevEdgeVerification(params: {
  rawMermaid: string;
  sourceSnippets?: Record<string, string | string[]>;
}): Promise<JevEdgeVerificationResult> {
  const defaultResult: JevEdgeVerificationResult = {
    mermaid: params.rawMermaid,
    verifiedEdgesCount: 0,
    prunedEdgesCount: 0,
    confidenceAvg: 1.0,
  };

  if (!isTypeSafeConfigured() || !params.rawMermaid.trim()) {
    return defaultResult;
  }

  const lines = params.rawMermaid.split("\n");
  const edgeRegex =
    /^\s*([a-zA-Z0-9_-]+)\s*(-->|-.->|==>|-->\|[^|]+\|)\s*([a-zA-Z0-9_-]+)\s*$/;

  const parsedEdges: { index: number; edge: ParsedEdge }[] = [];

  lines.forEach((line, idx) => {
    const match = line.match(edgeRegex);
    if (match && match[1] && match[3]) {
      const source = match[1];
      const operator = match[2] || "-->";
      const target = match[3];
      const labelMatch = operator.match(/\|([^|]+)\|/);
      const label = labelMatch ? labelMatch[1] : undefined;

      parsedEdges.push({
        index: idx,
        edge: {
          originalLine: line,
          source,
          target,
          operator,
          label,
        },
      });
    }
  });

  if (parsedEdges.length === 0) {
    return defaultResult;
  }

  // Cap at 20 edges per diagram for fast sub-300ms evaluation
  const edgesToVerify = parsedEdges.slice(0, 20);

  const state: Record<string, unknown> = {
    edges: edgesToVerify.map((pe, i) => ({
      id: `edge_${i}`,
      source: pe.edge.source,
      target: pe.edge.target,
      label: pe.edge.label || "",
      contextSnippet: (() => {
        const val = params.sourceSnippets?.[pe.edge.source];
        if (Array.isArray(val)) return val.join(", ").slice(0, 300);
        return typeof val === "string" ? val.slice(0, 300) : "";
      })(),
    })),
  };

  const questions: Record<string, unknown> = {};
  edgesToVerify.forEach((pe, i) => {
    questions[`edge_${i}`] = choice(
      `How does \`edges[${i}].source\` connect to \`edges[${i}].target\` in the architecture?`,
      {
        direct_call:
          "Direct synchronous invocation, dependency injection, or class usage",
        data_flow:
          "Asynchronous event, shared state, data transfer, or transitively coupled",
        unverified_or_none:
          "No functional relationship, dead reference, or hallucinated link",
      },
    );
  });

  const answers = await executeSystemOneSafely({ state, questions });
  if (!answers) {
    return defaultResult;
  }

  let verifiedCount = 0;
  let prunedCount = 0;
  let totalConfidence = 0;

  const linesToKeep = [...lines];

  edgesToVerify.forEach((pe, i) => {
    const ans = (answers as any)[`edge_${i}`];
    if (!ans) {
      verifiedCount++;
      return;
    }

    const decision = ans.choice;
    const confidence = ans.confidence ?? 0.8;
    totalConfidence += confidence;

    if (
      decision === "direct_call" &&
      (confidence >= 0.5 || (ans.probabilities?.direct_call ?? 0) >= 0.5)
    ) {
      // Solid arrow
      const labelPart = pe.edge.label ? `|${pe.edge.label}| ` : "";
      linesToKeep[pe.index] =
        `    ${pe.edge.source} -->${labelPart}${pe.edge.target}`;
      verifiedCount++;
    } else if (
      decision === "data_flow" &&
      (confidence >= 0.45 || (ans.probabilities?.data_flow ?? 0) >= 0.45)
    ) {
      // Dashed arrow
      const label = pe.edge.label || "dataflow";
      linesToKeep[pe.index] =
        `    ${pe.edge.source} -.->|${label}| ${pe.edge.target}`;
      verifiedCount++;
    } else if (decision !== "unverified_or_none" && confidence >= 0.35) {
      // Keep original line if plausible connection
      linesToKeep[pe.index] = pe.edge.originalLine;
      verifiedCount++;
    } else {
      // Prune hallucinated or unverified edge
      linesToKeep[pe.index] =
        `    %% [JEV PRUNED] ${pe.edge.source} -> ${pe.edge.target} (${decision}, conf: ${confidence.toFixed(2)})`;
      prunedCount++;
    }
  });

  const confidenceAvg =
    edgesToVerify.length > 0 ? totalConfidence / edgesToVerify.length : 1.0;

  return {
    mermaid: linesToKeep.join("\n"),
    verifiedEdgesCount: verifiedCount,
    prunedEdgesCount: prunedCount,
    confidenceAvg,
  };
}
