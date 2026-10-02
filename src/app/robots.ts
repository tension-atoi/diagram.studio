import type { MetadataRoute } from "next";
import { SITE_URL } from "~/lib/site";
import { getSitemapUrls } from "~/lib/sitemaps";

// The crawlers behind ChatGPT, Claude, Perplexity, Gemini, Apple and Bing.
const AI_CRAWLERS = [
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
];

export default async function robots(): Promise<MetadataRoute.Robots> {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
      {
        // AI search and assistant crawlers read the pages, /llms.txt and each
        // repository's Markdown twin (/{owner}/{repo}.md). Named explicitly,
        // since a crawler follows only the most specific group naming it.
        userAgent: [...AI_CRAWLERS],
        allow: "/",
        disallow: ["/api/"],
      },
      {
        // Bulk repo/image crawls create disproportionate origin traffic.
        userAgent: ["Amazonbot", "Brightbot"],
        allow: "/",
        disallow: ["/api/", "/*/*"],
      },
    ],
    sitemap: getSitemapUrls(SITE_URL),
  };
}
