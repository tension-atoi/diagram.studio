import { z } from "zod";

import { getDiagramStateRecord } from "~/server/storage/diagram-state";
import {
  credentialSchema,
  githubRepoSchema,
  githubUsernameSchema,
} from "~/server/generate/types";
import {
  NO_STORE_RESPONSE_HEADERS,
  parseSameOriginJsonRequest,
} from "~/server/http/same-origin-json";
import { resolveRequestCredentials } from "~/server/http/request-credentials";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

const MAX_DIAGRAM_STATE_REQUEST_BYTES = 4 * 1024;
const diagramStateRequestSchema = z.strictObject({
  username: githubUsernameSchema,
  repo: githubRepoSchema,
  github_pat: credentialSchema.optional(),
});

export async function POST(request: Request): Promise<Response> {
  const parsed = await parseSameOriginJsonRequest(request, {
    schema: diagramStateRequestSchema,
    maxBytes: MAX_DIAGRAM_STATE_REQUEST_BYTES,
    crossOriginError: "Cross-origin state access is not allowed.",
  });
  if (!parsed.success) {
    return parsed.response;
  }

  try {
    const { githubStorageKey } = await resolveRequestCredentials(request, {
      githubPat: parsed.data.github_pat,
    });
    const state = await getDiagramStateRecord(
      parsed.data.username,
      parsed.data.repo,
      githubStorageKey,
    );
    return Response.json(state, { headers: NO_STORE_RESPONSE_HEADERS });
  } catch {
    // Local-first: storage (R2) is often not configured, so return an empty
    // state and let the client generate instead of failing the request.
    // The caught error is never interpolated — it can carry credentials.
    console.error(
      JSON.stringify({
        event: "diagram_state.read_failed",
        visibility: "unknown",
        error: "Diagram state is unavailable; falling back to generation.",
      }),
    );
    return Response.json(
      {
        diagram: null,
        explanation: null,
        graph: null,
        visibility: parsed.data.github_pat?.trim() ? "private" : "public",
      },
      { headers: NO_STORE_RESPONSE_HEADERS },
    );
  }
}
