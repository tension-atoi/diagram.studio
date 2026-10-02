import { describe, expect, it } from "vitest";

import {
  formatDiagram,
  formatMissingDiagram,
  parseRepositoryInput,
} from "./format";

import { siteUrl } from "~/test-support/site";

const BASE = {
  username: "Owner",
  repo: "Repo",
  stargazerCount: 1234,
  lastSuccessfulAt: "2026-09-01T00:00:00.000Z",
  explanation: "An app.",
  diagram: "flowchart TD\n  a --> b",
};

describe("parseRepositoryInput", () => {
  it.each([
    ["fastapi/fastapi", "fastapi", "fastapi"],
    [" vercel/next.js ", "vercel", "next.js"],
    [
      "https://github.com/vercel/next.js/tree/canary/packages",
      "vercel",
      "next.js",
    ],
    ["github.com/vercel/next.js", "vercel", "next.js"],
    ["www.github.com/a/b?tab=readme", "a", "b"],
    ["git@github.com:facebook/react.git", "facebook", "react"],
    // A URL on this deployment's own site carries the same owner/repo.
    [siteUrl("/fastapi/fastapi"), "fastapi", "fastapi"],
  ])("reads %s", (input, username, repo) => {
    expect(parseRepositoryInput(input)).toEqual({ username, repo });
  });

  it.each([
    "fastapi",
    "how does react work",
    "https://gitlab.com/a/b",
    "a/..",
    "-bad/repo",
    "",
  ])("rejects %s", (input) => {
    expect(parseRepositoryInput(input)).toBeNull();
  });
});

describe("formatDiagram", () => {
  it("links the lowercase page and lists groups, loose nodes and edges", () => {
    const text = formatDiagram({
      ...BASE,
      graph: {
        groups: [{ id: "core", label: "Core", description: "The heart." }],
        nodes: [
          {
            id: "a",
            label: "API",
            type: "service",
            description: "Serves\nrequests.",
            groupId: "core",
            path: "src/api",
            shape: null,
          },
          {
            id: "b",
            label: "DB",
            type: "database",
            description: null,
            groupId: null,
            path: null,
            shape: "database",
          },
        ],
        edges: [
          {
            from: "a",
            to: "b",
            label: "queries",
            description: null,
            style: "dashed",
          },
        ],
      },
    });
    expect(text).toContain(`Interactive diagram: ${siteUrl("/owner/repo")}`);
    expect(text).toContain("★ 1,234 · diagram generated 2026-09-01");
    expect(text).toContain(
      "### Core\nThe heart.\n- **API** (service) `src/api`: Serves requests.",
    );
    expect(text).toContain("### Outside the groups\n- **DB** (database)");
    expect(text).toContain("- API → DB: queries [dashed]");
    expect(text).toContain("```mermaid\nflowchart TD\n  a --> b\n```");
  });

  it("works for an older artifact stored without a graph", () => {
    const text = formatDiagram({ ...BASE, graph: null });
    expect(text).not.toContain("## Components");
    expect(text).toContain("```mermaid");
  });
});

describe("formatMissingDiagram", () => {
  it("points at the page that makes one, and never claims a similar diagram", () => {
    const text = formatMissingDiagram({ username: "a", repo: "b" });
    expect(text).toContain("no diagram of a/b yet");
    expect(text).toContain(siteUrl("/a/b"));
    expect(text).not.toContain("Similar repositories");
  });
});
