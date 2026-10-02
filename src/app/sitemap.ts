import type { MetadataRoute } from "next";

import { GUIDE_UPDATED } from "~/features/guide/content";
import { SITE_URL } from "~/lib/site";

/**
 * The pages worth indexing.
 *
 * There is no repository listing any more: the global catalogue it used to page
 * through belonged to the hosted service. A repository's own URL is discovered
 * through its README badge, not by crawling.
 */
function getStaticRoutes(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/visualize-codebase`,
      lastModified: new Date(GUIDE_UPDATED),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}

export function generateSitemaps() {
  return [{ id: 0 }];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return getStaticRoutes();
}
