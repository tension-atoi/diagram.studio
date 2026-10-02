import { describe, expect, it } from "vitest";

import { SITE_URL } from "~/lib/site";
import { siteUrl } from "~/test-support/site";

import robots from "./robots";
import sitemap, { generateSitemaps } from "./sitemap";

describe("robots.txt", () => {
  it("keeps crawlers off /api", async () => {
    const [everyone] = (await robots()).rules as Array<{
      allow: string[];
      disallow: string[];
    }>;
    expect(everyone!.disallow).toContain("/api/");
  });

  it("names the AI search and assistant crawlers with the same rules", async () => {
    const [everyone, ai, bulk] = (await robots()).rules as Array<{
      userAgent: string | string[];
      allow: string | string[];
      disallow: string[];
    }>;
    expect(ai!.userAgent).toEqual(
      expect.arrayContaining([
        "OAI-SearchBot",
        "ChatGPT-User",
        "GPTBot",
        "ClaudeBot",
        "Claude-SearchBot",
        "Claude-User",
        "PerplexityBot",
        "Perplexity-User",
        "Google-Extended",
        "Applebot-Extended",
        "bingbot",
      ]),
    );
    // Pages, /llms.txt and /{owner}/{repo}.md are all under "/".
    expect(ai!.allow).toEqual(everyone!.allow);
    expect(ai!.disallow).toEqual(everyone!.disallow);
    // The bulk crawlers stay off repository pages.
    expect(bulk!.userAgent).toEqual(["Amazonbot", "Brightbot"]);
    expect(bulk!.disallow).toContain("/*/*");
  });

  it("points at the single sitemap shard", async () => {
    expect(await generateSitemaps()).toHaveLength(1);
    expect((await robots()).sitemap).toEqual([siteUrl("/sitemap/0.xml")]);
  });
});

describe("sitemap", () => {
  it("lists the home page and the guide, and nothing that is gone", async () => {
    const urls = (await sitemap()).map((route) => route.url);
    expect(urls).toEqual([SITE_URL, siteUrl("/visualize-codebase")]);
  });
});
