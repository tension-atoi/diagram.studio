import { SITE_URL } from "~/lib/site";

// What get_repository_diagram hands its diagram view (the MCP App shown inline
// in ChatGPT and other MCP Apps hosts, src/mcp-app/). It travels in the tool
// result's `_meta`, which hosts give the view but never the model: the model
// already reads the same diagram as text.

export const DIAGRAM_META_KEY = "com.gnu.in.labs/diagram";

export interface DiagramViewPayload {
  /** "found": `mermaid` is the stored diagram. "missing": none made yet. */
  status: "found" | "missing";
  /** "owner/repo", as GitHub spells it when a diagram is stored. */
  repository: string;
  /** The interactive diagram, on this deployment's own site. */
  diagramUrl: string;
  githubUrl: string;
  stars: number | null;
  mermaid: string | null;
}

const MAX_MERMAID_LENGTH = 200_000;

/**
 * A link the view is allowed to open: GitHub, or this deployment's own site.
 * Both are checked from the environment rather than a list, so the view can
 * never be pointed at a third party's domain.
 */
export function isOpenableUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    const site = new URL(SITE_URL);
    const self = site.hostname.toLowerCase();
    return (
      !url.username &&
      !url.password &&
      (url.hostname === "github.com" ||
        url.hostname === self ||
        (url.protocol === site.protocol && url.hostname === self))
    );
  } catch {
    return false;
  }
}

/**
 * Reads the payload out of a tool result, or null when it is missing or
 * malformed. The view treats the result as untrusted input.
 */
export function readDiagramPayload(result: unknown): DiagramViewPayload | null {
  if (!result || typeof result !== "object") return null;
  const meta = (result as { _meta?: unknown })._meta;
  if (!meta || typeof meta !== "object") return null;
  const payload = (meta as Record<string, unknown>)[DIAGRAM_META_KEY];
  if (!payload || typeof payload !== "object") return null;
  const value = payload as Record<string, unknown>;

  const status = value.status;
  if (status !== "found" && status !== "missing") return null;
  if (
    typeof value.repository !== "string" ||
    !/^[\w.-]+\/[\w.-]+$/.test(value.repository)
  )
    return null;
  if (!isOpenableUrl(value.diagramUrl) || !isOpenableUrl(value.githubUrl))
    return null;
  const mermaid =
    typeof value.mermaid === "string" &&
    value.mermaid.trim() &&
    value.mermaid.length <= MAX_MERMAID_LENGTH
      ? value.mermaid
      : null;
  if (status === "found" && !mermaid) return null;
  const stars =
    typeof value.stars === "number" &&
    Number.isFinite(value.stars) &&
    value.stars >= 0
      ? Math.floor(value.stars)
      : null;

  return {
    status,
    repository: value.repository,
    diagramUrl: value.diagramUrl,
    githubUrl: value.githubUrl,
    stars,
    mermaid: status === "found" ? mermaid : null,
  };
}
