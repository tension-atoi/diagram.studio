/**
 * The sitemap is one file with the two pages worth indexing.
 *
 * It used to shard, because it paged through a catalogue of every diagram on
 * the internet. There is no catalogue now: a repository's URL is discovered
 * through its README badge, not by crawling, and the library is machine-local
 * and marked noindex.
 */
export function getSitemapUrls(siteUrl: string): string[] {
  return [`${siteUrl}/sitemap/0.xml`];
}
