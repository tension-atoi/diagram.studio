# Sponsor placement: campaign schedule and click capture

The sponsor program is **not active**: both of its campaigns have ended, its
reporting dashboards live in a PostHog project this repository has no access to,
and nothing here is booked or being measured. This page documents the mechanism
that remains in the tree, so it is not mistaken for something that runs.

## Current state: expired and inert

Two campaigns are still declared in `src/lib/sponsor-campaign.ts`:

| id | sponsor | ran |
|---|---|---|
| `sent-2026-09` | Sent | 2026-09-19 → 2026-10-19 |
| `coderabbit-2026-10` | CodeRabbit | 2026-10-19 → 2026-11-19 |

Both windows have closed, so `activeSponsorCampaigns()` returns an empty list at
any present timestamp and every placement renders as vacant inventory linking
to `/advertise`. The campaign dates are kept because historical `/out/<id>`
links should keep resolving to `/advertise` rather than 404.

The destinations belong to those sponsors' past bookings. They are inert data,
not links this app advertises.

Two further gates mean no click is ever recorded:

- `isProductionSponsorHost()` requires a production hostname. This app serves
  itself on `127.0.0.1`, so the check fails.
- `recordSponsorEvent()` posts to PostHog, and no PostHog key is configured
  (see [analytics](./posthog.md)).

## The capture mechanism, if it were ever used

A click on a placement hits `/out/<campaign-id>?placement=home|diagram|browse|readme`.
The route validates the campaign and the placement against allowlists in code,
then issues an uncached 302 to the sponsor with `utm_source`, `utm_medium=sponsorship`,
the campaign's `utm_campaign`, and a placement-specific `utm_content`. An unknown
campaign or placement is a 404, and URL parameters cannot turn this into an
arbitrary redirect.

If a campaign is not active, the click goes to `/advertise` and is not recorded.

Deduplication, had it run, would be: Redis `SET NX` accepts one click per network
(Ipv6 /48), campaign and placement every 30 minutes, capped per campaign per hour
by `SPONSOR_CLICKS_PER_CAMPAIGN_HOUR` (default 5,000), failing open if Redis is
down. Identity is a random first-party cookie scoped to `/out`, HttpOnly, Secure,
SameSite=Lax, 30 days. Head requests, known bot user agents, speculative prefetch
and DNT/GPC requests are excluded.

Event properties would be `campaign`, `sponsor`, `placement` and `is_test`; no
visitor IP, referrer, repository path or raw user agent is included.

`src/server/sponsor-clicks.test.ts` covers attribution, anonymous identity, bot
and prefetch filtering, opt-outs, destination allowlisting, inactive campaigns,
dedupe, ceilings and capture failures. Those tests still run, so the mechanism
does not silently rot.

## Removing it

The sponsor program is separable and is removed as a unit, not file by file:

- `src/lib/sponsor-campaign.ts`, `sponsor-creative.ts`, `sponsor-readme.ts`
- `src/app/out/[campaign]/route.ts`, `src/app/api/sponsor/`, `src/app/advertise/`
- `src/server/sponsor-clicks.ts`, `sponsor-impressions.ts`, `sponsor-stats.ts`
- the corresponding tests, `public/sponsors/`, and the redirect in
  `next.config.js` that sends `/sponsor` to `/advertise`

Nothing else imports those modules, so removal does not touch generation,
storage or the MCP server. The `/advertise` page and the redirect are the only
user-visible surfaces.