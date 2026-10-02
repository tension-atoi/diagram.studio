import "server-only";

import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import {
  McpServer,
  type CallToolResult,
  type ServerContext,
} from "@modelcontextprotocol/server";
import { after } from "next/server";
import { z } from "zod";

import type { DiagramViewPayload } from "~/features/mcp-app/diagram-payload";
import { SITE_URL } from "~/lib/site";
import { getClientIp } from "~/server/http/client-ip";
import { errorText, logEvent } from "~/server/log";
import { getPublicDiagramArtifact } from "~/server/storage/artifact-store";
import {
  DIAGRAM_VIEW_TOOL_META,
  diagramViewResultMeta,
  registerDiagramView,
} from "./app";
import {
  diagramUrl,
  formatDiagram,
  formatMissingDiagram,
  invalidRepositoryMessage,
  parseRepositoryInput,
} from "./format";
import {
  consumeMcpRateLimit,
  mcpCallerKey,
  recordMcpCall,
  type McpOutcome,
  type McpToolName,
} from "./usage";

// the studio's MCP server: read-only tools over what the site has already
// stored (diagrams in the public R2 namespace, the browse index, explainer
// videos). Nothing here starts a paid generation or reads a private artifact.
// The tool descriptions are what make an agent pick diagram studio, so they say
// plainly when to call each tool. get_repository_diagram also carries an
// interactive diagram view for hosts that show MCP Apps (./app.ts).

export const MCP_SERVER_VERSION = "1.0.0";

const SERVER_INFO = {
  name: "diagram-studio",
  title: "diagram studio",
  version: MCP_SERVER_VERSION,
  description:
    "Architecture diagrams and explanations of public GitHub repositories.",
  websiteUrl: SITE_URL,
  icons: [
    {
      src: `${SITE_URL}/favicon.ico`,
      mimeType: "image/x-icon",
      sizes: ["any"],
    },
  ],
};

const INSTRUCTIONS = `This studio turns public GitHub repositories into architecture diagrams. When a user wants to understand, visualize or get an overview of a GitHub repository's architecture, call get_repository_diagram with "owner/repo" or a GitHub URL: it returns a written explanation, the main components with their source paths, how they connect, and Mermaid source. Use find_repository_diagrams to look up a project's exact owner/repo by name. Each result includes an interactive diagram link where every component links to its code.`;

const READ_ONLY = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

const repositoryInput = z.object({
  repository: z
    .string()
    .min(1)
    .max(500)
    .describe(
      'The GitHub repository as "owner/repo" (e.g. "fastapi/fastapi") or any github.com URL inside it (e.g. "https://github.com/vercel/next.js/tree/canary/packages").',
    ),
});

interface ToolOutcome {
  text: string;
  outcome: McpOutcome;
  subject?: string;
  /** What the diagram view shows (get_repository_diagram only). */
  view?: DiagramViewPayload;
}

const text = (
  value: string,
  isError = false,
  view?: DiagramViewPayload,
): CallToolResult => ({
  content: [{ type: "text", text: value }],
  ...(isError ? { isError: true } : {}),
  ...(view ? { _meta: diagramViewResultMeta(view) } : {}),
});

function later(task: () => Promise<unknown>): void {
  try {
    after(task);
  } catch {
    // Outside a request scope (tests, scripts): run it detached.
    void task().catch(() => undefined);
  }
}

async function getRepositoryDiagram(input: string): Promise<ToolOutcome> {
  const ref = parseRepositoryInput(input);
  if (!ref)
    return { text: invalidRepositoryMessage(input), outcome: "invalid" };
  const subject = `${ref.username}/${ref.repo}`;
  const artifact = await getPublicDiagramArtifact(ref.username, ref.repo);
  if (!artifact?.diagram)
    return {
      text: formatMissingDiagram(ref),
      outcome: "missing",
      subject,
      view: {
        status: "missing",
        repository: subject,
        diagramUrl: diagramUrl(ref),
        githubUrl: `https://github.com/${subject}`,
        stars: null,
        mermaid: null,
      },
    };
  const repository = `${artifact.username}/${artifact.repo}`;
  return {
    text: formatDiagram(artifact),
    outcome: "found",
    subject,
    view: {
      status: "found",
      repository,
      diagramUrl: diagramUrl(artifact),
      githubUrl: `https://github.com/${repository}`,
      stars: artifact.stargazerCount ?? null,
      mermaid: artifact.diagram,
    },
  };
}

/** Runs one tool call behind the limiter, and counts it after the response. */
async function runTool(
  request: Request | undefined,
  tool: McpToolName,
  clientName: string | null,
  ctx: Pick<ServerContext, "mcpReq"> | undefined,
  work: () => Promise<ToolOutcome>,
): Promise<CallToolResult> {
  const clientIp = request ? getClientIp(request) : null;
  let result: ToolOutcome;
  const limit = await consumeMcpRateLimit(
    clientIp,
    mcpCallerKey(ctx?.mcpReq._meta?.["openai/subject"]),
  );
  if (!limit.allowed) {
    const minutes = Math.max(Math.ceil(limit.retryAfterSeconds / 60), 1);
    result = {
      text: `Too many diagram studio requests from this network. Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`,
      outcome: "limited",
    };
  } else {
    try {
      result = await work();
    } catch (error) {
      logEvent("error", "mcp.tool_failed", { tool, error: errorText(error) });
      result = {
        text: "Diagram studio could not read its stored diagrams just now. Try again in a minute.",
        outcome: "error",
      };
    }
  }

  later(async () => {
    await recordMcpCall({
      tool,
      outcome: result.outcome,
      clientIp,
      subject: result.subject,
    });
  });

  return text(
    result.text,
    result.outcome === "limited" ||
      result.outcome === "error" ||
      result.outcome === "invalid",
    result.view,
  );
}

/**
 * A fresh server for one HTTP request (the handler is stateless). `request`
 * is the HTTP request being served, for the limiter and the feed.
 */
export function createStudioMcpServer(
  request?: Request,
  clientName: string | null = null,
): McpServer {
  const server = new McpServer(SERVER_INFO, {
    instructions: INSTRUCTIONS,
    capabilities: { tools: {}, resources: {} },
  });

  registerDiagramView(server);

  registerAppTool(
    server,
    "get_repository_diagram",
    {
      title: "Get a GitHub repository's architecture diagram",
      description:
        "Get the architecture of a public GitHub repository from this studio: a written explanation of how the codebase is organized, its main components with the source paths they live in, how those components connect, and a Mermaid flowchart of the whole system, plus a link to the interactive diagram, where every component opens its code on GitHub. Use it whenever the user wants to understand, visualize, map or explain a GitHub repository's or open-source project's architecture, structure, main modules or data flow, wants an overview before reading unfamiliar code, or asks for an architecture or system diagram of a repo. Read-only and fast: it returns a diagram the studio has already made. If none exists yet, it returns a link that makes one when opened in a browser. Public repositories only. In chat apps that show interactive views, the result also appears as a zoomable diagram whose components open their code on GitHub.",
      inputSchema: repositoryInput,
      annotations: { title: "Get architecture diagram", ...READ_ONLY },
      _meta: DIAGRAM_VIEW_TOOL_META,
    },
    ({ repository }, ctx) =>
      runTool(request, "get_repository_diagram", clientName, ctx, () =>
        getRepositoryDiagram(repository),
      ),
  );

  return server;
}
