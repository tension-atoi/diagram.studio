import { describe, expect, it } from "vitest";

import { readmeMarkdown } from "./readme";

import { siteUrl } from "~/test-support/site";

describe("README embeds", () => {
  it("links a picture of the current diagram to the tagged repository page", () => {
    expect(readmeMarkdown("fastapi", "fastapi", "picture")).toBe(
      `[![Architecture diagram of fastapi/fastapi](${siteUrl("/fastapi/fastapi/diagram.png")})](${siteUrl("/fastapi/fastapi")}?utm_source=readme&utm_medium=picture)`,
    );
  });

  it("links the shared badge to the tagged repository page", () => {
    expect(readmeMarkdown("acme", "demo.js", "badge")).toBe(
      `[![Architecture diagram](${siteUrl("/diagram-badge.svg")})](${siteUrl("/acme/demo.js")}?utm_source=readme&utm_medium=badge)`,
    );
  });
});
