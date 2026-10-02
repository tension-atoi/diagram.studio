import type { MetadataRoute } from "next";
import { SITE_URL } from "~/lib/site";
import { getSitemapUrls } from "~/lib/sitemaps";
import { generateSitemaps } from "./sitemap";

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
  // The same pages the sitemap splits into, so every shard is listed.
  const sitemaps = await generateSitemaps();

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
    sitemap: getSitemapUrls(SITE_URL, sitemaps.length),
  };
}
