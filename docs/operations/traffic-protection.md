# Caching and page regeneration

How long a rendered page, image or metadata file stays valid before this app
regenerates it. This matters locally too: every value below is a real interval
that runs against the local server on `127.0.0.1`, so a stale diagram or a
regenerated image is the same symptom here as it would be behind a CDN.

There is no firewall, no CDN and no edge in this application. It serves from one
machine, so nothing below is a defence against scraping — it is cache control,
and that is a different problem.

## Revalidation intervals

Declared as `export const revalidate` on the route or page:

| Route | Interval | What it serves |
|---|---|---|
| `[username]/[repo]/page.tsx` | 6 h (21600 s) | the repository diagram page |
| `[username]/[repo]/llms.txt/route.ts` | 6 h (21600 s) | the plain-text view for language models |
| `[username]/[repo]/opengraph-image/route.ts` | 1 day (86400 s) | the Open Graph card |
| `[username]/[repo]/diagram.png/route.ts` | 1 day (86400 s) | the PNG export |

The page and its social image are the expensive pair: the page renders the
diagram, the image renders a card from it. A one-day image interval against a
six-hour page is deliberate — a card is expensive to draw and rarely needs to be
current.

## Explicit invalidation

Intervals are the fallback. When something actually changes, the cache is
invalidated by tag or path so the next request is fresh:

- `diagram-metadata` and the generation path invalidate the page and image routes
  for a repository after a successful public generation, so a fresh diagram is
  visible immediately rather than after the interval.
- `revalidateTag(public-diagram-state:<owner>:<repo>, { expire: 0 })` expires the
  stored state itself, so a regenerated diagram survives the very next reload.

Successful generations use the normalized path and the requested casing, so
neither `/Owner/Repo` nor `/owner/repo` serves a stale copy of the other.

## URL normalisation

Mixed-case repository and image URLs redirect to their lowercase form, so a
repository has one cache entry per route rather than one per casing. Both social
metadata fields point at the same Open Graph image, so the card is rendered once.

## If this app is ever exposed publicly

Rate limiting exists on the API routes, but there is no WAF, no challenge, and
no crawler policy. Do not assume the caching described here protects a public
deployment.