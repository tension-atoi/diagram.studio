import type { DiagramGraph } from "~/features/diagram/graph";
import { parseGitHubRepoUrl } from "~/features/diagram/github-url";
import { SITE_URL } from "~/lib/site";
import {
  githubRepoSchema,
  githubUsernameSchema,
} from "~/server/generate/types";
import type { DiagramArtifact } from "~/server/storage/types";

// What the MCP tools say, as Markdown an agent can read and quote. Kept free of
// storage so every answer shape is tested directly.

export interface RepositoryRef {
  username: string;
  repo: string;
}

/**
 * Reads "owner/repo", a github.com URL (any page inside the repository, with
 * or without the scheme), an SSH remote, or a repository URL on this
 * deployment's own site.
 */
export function parseRepositoryInput(input: string): RepositoryRef | null {
  const trimmed = input.trim().replace(/^@/, "");

  // A page URL on this deployment's own site names the same owner/repo the
  // GitHub URL does, so both hostnames are accepted here and the site one is
  // rewritten to GitHub before parsing. The host comes from the environment, so
  // the two are never out of step.
  // `host`, not `hostname`: a local origin carries its port
  // (127.0.0.1:3000), and dropping it would stop matching the site's own URLs.
  const siteHost = (() => {
    try {
      return new URL(SITE_URL).host.toLowerCase();
    } catch {
      return null;
    }
  })();
  const sitePattern = siteHost
    ? `(?:github\\.com|${siteHost.replace(/\./g, "\\.")})`
    : "github\\.com";
  const bare = new RegExp(`^(?:www\\.)?${sitePattern}/`, "i");
  const withScheme = bare.test(trimmed) ? `https://${trimmed}` : trimmed;
  const siteHostPattern = siteHost
    ? new RegExp(
        `^(https?://)(?:www\\.)?${siteHost.replace(/\./g, "\\.")}/`,
        "i",
      )
    : undefined;
  const onGitHub = siteHostPattern
    ? withScheme.replace(siteHostPattern, "$1github.com/")
    : withScheme;
  const parsed = parseGitHubRepoUrl(onGitHub);
  if (!parsed) return null;
  const username = githubUsernameSchema.safeParse(parsed.username);
  const repo = githubRepoSchema.safeParse(parsed.repo);
  return username.success && repo.success
    ? { username: username.data, repo: repo.data }
    : null;
}

/** The query find_repository_diagrams matches against "owner/repo". */
export function diagramUrl({ username, repo }: RepositoryRef): string {
  return `${SITE_URL}/${username.toLowerCase()}/${repo.toLowerCase()}`;
}

const githubUrl = ({ username, repo }: RepositoryRef) =>
  `https://github.com/${username}/${repo}`;

const stars = (count: number | null | undefined) =>
  typeof count === "number" ? `★ ${count.toLocaleString("en-US")}` : null;

const day = (iso: string) =>
  Number.isFinite(Date.parse(iso)) ? iso.slice(0, 10) : null;

/** One line of text: no newlines or runs of spaces from stored labels. */
const inline = (text: string) => text.replace(/\s+/g, " ").trim();

function formatComponents(graph: DiagramGraph): string[] {
  const lines = [`## Components (${graph.nodes.length})`, ""];
  const node = (entry: DiagramGraph["nodes"][number]) => {
    const type = inline(entry.type);
    // Most nodes are typed plain "component"; only a real kind says anything.
    const parts = [
      `- **${inline(entry.label)}**${type.toLowerCase() === "component" ? "" : ` (${type})`}`,
    ];
    if (entry.path) parts.push(`\`${inline(entry.path)}\``);
    const line = parts.join(" ");
    return entry.description ? `${line}: ${inline(entry.description)}` : line;
  };
  for (const group of graph.groups) {
    const members = graph.nodes.filter((entry) => entry.groupId === group.id);
    if (!members.length) continue;
    lines.push(`### ${inline(group.label)}`);
    if (group.description) lines.push(inline(group.description));
    lines.push(...members.map(node), "");
  }
  const groupIds = new Set(graph.groups.map((group) => group.id));
  const loose = graph.nodes.filter(
    (entry) => !entry.groupId || !groupIds.has(entry.groupId),
  );
  if (loose.length) {
    if (graph.groups.length) lines.push("### Outside the groups");
    lines.push(...loose.map(node), "");
  }

  const labels = new Map(
    graph.nodes.map((entry) => [entry.id, inline(entry.label)]),
  );
  lines.push(`## Connections (${graph.edges.length})`, "");
  for (const edge of graph.edges) {
    let line = `- ${labels.get(edge.from) ?? edge.from} → ${labels.get(edge.to) ?? edge.to}`;
    if (edge.label) line += `: ${inline(edge.label)}`;
    if (edge.description) line += ` (${inline(edge.description)})`;
    if (edge.style === "dashed") line += " [dashed]";
    if (edge.evidencePath) line += ` — evidence: ${edge.evidencePath}`;
    lines.push(line);
  }
  lines.push("");
  return lines;
}

/** get_repository_diagram's answer when a diagram is stored. */
export function formatDiagram(
  artifact: Pick<
    DiagramArtifact,
    | "username"
    | "repo"
    | "stargazerCount"
    | "diagram"
    | "explanation"
    | "graph"
    | "lastSuccessfulAt"
  >,
): string {
  const ref = { username: artifact.username, repo: artifact.repo };
  const facts = [
    githubUrl(ref),
    stars(artifact.stargazerCount),
    day(artifact.lastSuccessfulAt)
      ? `diagram generated ${day(artifact.lastSuccessfulAt)}`
      : null,
  ].filter(Boolean);
  const lines = [
    `# Architecture of ${artifact.username}/${artifact.repo} (diagram studio)`,
    "",
    `Interactive diagram: ${diagramUrl(ref)} (zoomable; every component links to its source on GitHub)`,
  ];
  lines.push(`Repository: ${facts.join(" · ")}`, "");
  if (artifact.explanation.trim())
    lines.push("## Explanation", "", artifact.explanation.trim(), "");
  if (artifact.graph) lines.push(...formatComponents(artifact.graph));
  lines.push(
    "## Mermaid diagram",
    "",
    "```mermaid",
    artifact.diagram.trim(),
    "```",
    "",
    `When sharing this with the user, link the interactive diagram: ${diagramUrl(ref)}`,
  );
  return lines.join("\n");
}

/** get_repository_diagram's answer when nothing is stored for the repository. */
export function formatMissingDiagram(ref: RepositoryRef): string {
  return [
    `Diagram studio has no diagram of ${ref.username}/${ref.repo} yet.`,
    "",
    `To make one, open ${diagramUrl(ref)} in a browser: if the repository is public, diagram studio makes its architecture diagram there, usually in about a minute. Then call get_repository_diagram again to read it.`,
    "",
    "This tool never starts a generation itself. Check the owner/repo spelling if the repository should already have one.",
  ].join("\n");
}

export function invalidRepositoryMessage(input: string): string {
  return `"${inline(input).slice(0, 200)}" is not a GitHub repository. Pass "owner/repo" (for example "fastapi/fastapi") or a github.com URL inside the repository.`;
}
