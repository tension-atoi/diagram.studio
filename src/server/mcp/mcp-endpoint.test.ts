// The MCP server itself is the whole interface for AI agents. There is no
// registry manifest and no agent-plugin package: this server is reached at the
// local port the app confirms on first launch, not at a published endpoint, so
// there is nothing to publish to a registry and nothing for a package to point
// at. `MCP_URL` in src/lib/site.ts derives the address from PORT, which is why
// each expectation here sets PORT itself rather than inheriting one.
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const SITE_MODULE = "~/lib/site";

async function mcpUrlFor(port: string): Promise<string> {
  vi.stubEnv("PORT", port);
  vi.resetModules();
  const { MCP_URL } = await import(SITE_MODULE);
  return MCP_URL;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("the local MCP endpoint", () => {
  it("is derived from the port the app listens on", async () => {
    const url = new URL(await mcpUrlFor("7421"));

    expect(url.protocol).toBe("http:");
    expect(url.hostname).toBe("127.0.0.1");
    expect(url.port).toBe("7421");
    expect(url.pathname).toBe("/mcp");
  });

  it("follows PORT rather than a compiled-in address", async () => {
    expect(await mcpUrlFor("8123")).toBe("http://127.0.0.1:8123/mcp");
    expect(await mcpUrlFor("9999")).toBe("http://127.0.0.1:9999/mcp");
  });

  it("is an address on this machine, never a public host", async () => {
    const url = new URL(await mcpUrlFor("7421"));

    expect(url.hostname).toBe("127.0.0.1");
  });
});

describe("the server's reported version", () => {
  it("is a semantic version an agent can report", async () => {
    vi.resetModules();
    const { MCP_SERVER_VERSION } = await import("./server");

    expect(MCP_SERVER_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
