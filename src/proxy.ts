import {
  type NextFetchEvent,
  type NextRequest,
  NextResponse,
} from "next/server";

const REJECTION_HEADERS = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

// First path segments that are the site's own, never a GitHub owner.
const RESERVED_FIRST_SEGMENTS = new Set([
  "api",
  "_next",
  "sitemap",
  "admin",
  "mcp",
  "mcp-app",
  ".well-known",
]);

/**
 * Where the Markdown twin of a repository page lives, when this request asks
 * for it: /{owner}/{repo}.md, or the page URL with `Accept: text/markdown`
 * (agents; browsers never send it). User agents are never sniffed.
 */
function markdownRoute(request: NextRequest): string | null {
  const match = /^\/([^/]+)\/([^/]+?)(\.md)?\/?$/.exec(
    request.nextUrl.pathname,
  );
  if (!match) return null;
  const [, owner, repo, extension] = match;
  if (!owner || !repo || RESERVED_FIRST_SEGMENTS.has(owner.toLowerCase())) {
    return null;
  }
  const wantsMarkdown =
    Boolean(extension) ||
    /(?:^|,)\s*text\/markdown\s*(?:[;,]|$)/i.test(
      request.headers.get("accept") ?? "",
    );
  return wantsMarkdown ? `/${owner}/${repo}/llms.txt` : null;
}

/**
 * The app does not expose Server Actions. Reject forged action requests at
 * the proxy boundary so they never reach the Next.js action decoder.
 */
export function proxy(
  request: NextRequest,
  _event?: NextFetchEvent,
): NextResponse {
  if (!request.headers.has("next-action")) {
    const markdown =
      request.method === "GET" || request.method === "HEAD"
        ? markdownRoute(request)
        : null;
    // Only mixed-case repository URLs and Markdown requests enter this branch
    // in production. Keep query parameters
    // attribution) on redirects.
    if (request.method === "GET" || request.method === "HEAD") {
      const url = request.nextUrl.clone();
      const path = url.pathname;
      if (
        !/^\/(?:api|_next)\//i.test(path) &&
        /^\/[^/]+\/[^/]+(?:\/opengraph-image)?\/?$/.test(path) &&
        path !== path.toLowerCase()
      ) {
        url.pathname = path.toLowerCase();
        return NextResponse.redirect(url, 308);
      }
      if (markdown) {
        url.pathname = markdown;
        return NextResponse.rewrite(url);
      }
    }
    return NextResponse.next();
  }

  return new NextResponse(null, {
    status: 404,
    headers: REJECTION_HEADERS,
  });
}

export const config = {
  matcher: [
    {
      source: "/:path*",
      has: [{ type: "header", key: "next-action" }],
    },
    // Case-sensitive lookahead avoids running Proxy on ordinary lowercase
    // pages, APIs, or assets merely to normalize a URL.
    "/((?!api/|_next/)(?=[^/]*[A-Z]|[^/]+/[^/]*[A-Z])[^/]+/[^/]+(?:/opengraph-image)?)",
    // A repository page's Markdown twin (see markdownRoute).
    "/((?!api/|_next/)[^/]+/[^/]+\\.md)",
    {
      source: "/((?!api/|_next/)[^/]+/[^/]+)",
      has: [{ type: "header", key: "accept", value: ".*text/markdown.*" }],
    },
  ],
};
