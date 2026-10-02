import { describe, expect, it } from "vitest";

import { getSitemapUrls } from "~/lib/sitemaps";

describe("sitemap urls", () => {
  it("is a single shard", () => {
    expect(getSitemapUrls("https://studio.test")).toEqual([
      "https://studio.test/sitemap/0.xml",
    ]);
  });
});
