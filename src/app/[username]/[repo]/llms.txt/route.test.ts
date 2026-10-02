// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getStoredDiagramState: vi.fn(),
  cachedReads: [] as Array<{ key: string; tags?: string[] }>,
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  unstable_cache:
    (
      read: () => Promise<unknown>,
      keys: string[],
      options: { tags?: string[] },
    ) =>
    () => {
      mocks.cachedReads.push({ key: keys[0]!, tags: options.tags });
      return read();
    },
}));
vi.mock("~/server/storage/artifact-store", () => ({
  getStoredDiagramState: mocks.getStoredDiagramState,
}));

import { GET, revalidate } from "./route";

import { siteUrl } from "~/test-support/site";

const call = (username: string, repo: string) =>
  GET(new Request(siteUrl(`/${username}/${repo}.md`)), {
    params: Promise.resolve({ username, repo }),
  });

const stored = {
  diagram: 'flowchart TD\n  node_app["App"]',
  explanation: "Demo serves notes.",
  graph: {
    groups: [],
    nodes: [
      {
        id: "app",
        label: "App",
        type: "service",
        description: null,
        groupId: null,
        path: "app.py",
        shape: null,
      },
    ],
    edges: [],
  },
  latestSessionAudit: null,
  lastSuccessfulAt: "2026-09-19T00:00:00Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.cachedReads.length = 0;
});

describe("repository Markdown", () => {
  it("serves a stored diagram as Markdown with the page as canonical", async () => {
    mocks.getStoredDiagramState.mockResolvedValue(stored);
    const response = await call("acme", "demo");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "text/markdown; charset=utf-8",
    );
    expect(response.headers.get("link")).toBe(
      `<${siteUrl("/acme/demo")}>; rel="canonical"`,
    );
    expect(response.headers.get("vary")).toBe("Accept");
    const body = await response.text();
    expect(body).toContain("# acme/demo architecture");
    expect(body).toContain("Demo serves notes.");
    expect(body).toContain("```mermaid");
    expect(body).toContain(
      "[App](https://github.com/acme/demo/blob/HEAD/app.py)",
    );
  });

  it("reads only the public artifact, through the page's cache and tags", async () => {
    mocks.getStoredDiagramState.mockResolvedValue(stored);
    await call("acme", "demo");

    expect(mocks.getStoredDiagramState).toHaveBeenCalledWith({
      username: "acme",
      repo: "demo",
    });
    expect(mocks.cachedReads).toEqual([
      {
        key: "public-diagram-state",
        tags: ["public-diagram-state:acme:demo"],
      },
    ]);
    expect(revalidate).toBe(21600);
  });

  it("answers 404 with instructions when no diagram is stored", async () => {
    mocks.getStoredDiagramState.mockResolvedValue(null);
    const response = await call("acme", "new");

    expect(response.status).toBe(404);
    expect(response.headers.get("x-robots-tag")).toBe("noindex");
    expect(await response.text()).toContain(
      `open ${siteUrl("/acme/new")} in a browser`,
    );
  });

  it("answers 503 when storage fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.getStoredDiagramState.mockRejectedValue(new Error("R2 down"));
    const response = await call("acme", "demo");

    expect(response.status).toBe(503);
  });

  it("redirects mixed case and refuses names GitHub cannot have", async () => {
    const redirect = await call("Acme", "Demo");
    expect(redirect.status).toBe(308);
    expect(redirect.headers.get("location")).toBe(siteUrl("/acme/demo.md"));

    expect((await call("acme", "..")).status).toBe(404);
    expect((await call("a b", "demo")).status).toBe(404);
    expect(mocks.getStoredDiagramState).not.toHaveBeenCalled();
  });
});
