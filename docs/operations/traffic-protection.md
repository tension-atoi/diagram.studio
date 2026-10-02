# Caching and page regeneration

How long a rendered page, image or metadata file stays valid before this app
regenerates it. This matters locally too: every value below is a real interval
that runs against the local server on `127.0.0.1`, so a stale diagram or a
regenerated image is the same symptom here as it would be behind a CDN.

There is no firewall, no CDN and no edge in this application. It serves from one
machine, so nothing below is a defence against scraping — it is cache control,
and that is a different problem. See the last section for what was true of the
original deployment and no longer applies.

## Revalidation intervals

Declared as `export const revalidate` on the route or page:

| Route | Interval | What it serves |
|---|---|---|
| `[username]/[repo]/page.tsx` | 6 h (21600 s) | the repository diagram page |
| `[username]/[repo]/llms.txt/route.ts` | 6 h (21600 s) | the plain-text view for language models |
| `[username]/[repo]/video/page.tsx` | 5 min (300 s) | the video watch page |
| `[username]/[repo]/opengraph-image/route.ts` | 1 day (86400 s) | the Open Graph card |
| `[username]/[repo]/diagram.png/route.ts` | 1 day (86400 s) | the PNG export |
| `advertise`, `reels`, `videos` | 5 min (300 s) | the small rotating pages |

Repository pages and their social image are the expensive pair: the page renders
the diagram, the image renders a card from it. A one-day image interval against a
six-hour page is deliberate — a card is expensive to draw and rarely needs to be
current.

## Explicit invalidation

Intervals are the fallback. When something actually changes, the cache is
invalidated by tag or path so the next request is fresh:

- `src/server/browse-index-cache.ts` calls `revalidateTag(BROWSE_INDEX_CACHE_TAG)`
  after rewriting the browse index, so `/browse` never lists a diagram it cannot
  open.
- `src/server/explainer/cache.ts` invalidates the per-repository video summary
  tag and the catalogue tag, plus `revalidatePath()` for that repository's
  `/video` page, when a render finishes or is cleared.
- `diagram-metadata` and the generation path invalidate the page and image routes
  for a repository after a successful public generation, so a fresh diagram is
  visible immediately rather than after the interval.

Successful generations use the normalized path and the requested casing, so
neither `/Owner/Repo` nor `/owner/repo` serves a stale copy of the other.

## URL normalisation

Mixed-case repository and image URLs redirect to their lowercase form, and the
old Twitter image path redirects to the Open Graph one, so a repository has one
cache entry per route rather than one per casing. Both social metadata fields
point at the same Open Graph image, so the card is rendered once.

Browse links do not prefetch: opening a repository page from a list is what loads
it. Without that, a browse page would render every visible result in the
background.

## What does not apply here

The original deployment ran on Vercel behind a firewall and a CDN, and carried a
set of project-level rules for it: crawler user-agent denials (Amazonbot,
Brightbot), an ASN-scoped challenge for bulk repository scrapers, and CDN-level
redirects for social images. Those rules were tuned against observed crawl
patterns on a public host and none of them exist in this repository.

If this app is ever exposed publicly rather than bound to `127.0.0.1`, that
exposure is a separate piece of work: rate limiting exists on the API routes, but
there is no WAF, no challenge, and no crawler policy. Do not assume the caching
described here protects a public deployment.