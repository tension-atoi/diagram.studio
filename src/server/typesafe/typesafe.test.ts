import { describe, expect, it } from "vitest";
import {
  isTypeSafeConfigured,
  runJevPreEnrichment,
  runJevEdgeVerification,
} from "./index";

describe("TypeSafe / Jev integration", () => {
  it("detects unconfigured state safely without throwing", () => {
    // When no key is set in test env
    const configured = isTypeSafeConfigured();
    expect(typeof configured).toBe("boolean");
  });

  it("safely degrades pre-enrichment when unconfigured", async () => {
    const result = await runJevPreEnrichment({
      repoName: "test/repo",
      filePaths: ["src/index.ts", "package.json"],
    });
    // In unconfigured test env, returns null gracefully
    if (!isTypeSafeConfigured()) {
      expect(result).toBeNull();
    }
  });

  it("safely returns unmodified Mermaid when unconfigured", async () => {
    const mermaid = `flowchart TD\n    A --> B\n    B --> C`;
    const result = await runJevEdgeVerification({
      rawMermaid: mermaid,
    });
    expect(result.mermaid).toBe(mermaid);
    expect(result.verifiedEdgesCount).toBe(0);
    expect(result.prunedEdgesCount).toBe(0);
  });
});
