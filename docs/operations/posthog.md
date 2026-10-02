# Product analytics (PostHog)

This app has no analytics account. Nothing here is configured, nothing is
loaded, and nothing leaves the machine because of this document. It describes
what the code *would* do if a key were provided, so the mechanism is documented
rather than mysterious.

## Current state: dormant

Two independent gates keep the SDK dormant. Both must open for any event to be
sent:

1. **No key.** `NEXT_PUBLIC_POSTHOG_KEY` is not set. `src/lib/analytics-client.ts`
   reads it at module load and `getPostHog()` returns `null` when it is absent —
   the dynamic `import("posthog-js/...")` that would load the SDK never runs, so
   the library is not even in the JavaScript that ships.
2. **No page-view tracker.** `src/app/providers.tsx` holds `PostHogPageviewTracker`
   and `CSPostHogProvider`, which wrapped the tree in the original layout. The
   current `src/app/layout.tsx` does not mount either, so nothing calls the
   `$pageview` capture.

The per-feature calls below are still in the code and are harmless while gate 1
is closed: `captureAnalyticsEvent()` returns immediately when there is no
client. They are the reason the mechanism is still legible — if you set a key,
these are the events that would start flowing.

**To enable it**, you would need a PostHog project of your own, set
`NEXT_PUBLIC_POSTHOG_KEY` in the environment the app runs in, and mount
`CSPostHogProvider` in the layout. Until then, treat this page as a
description, not a configuration.

## What would be captured, and what would not

The client events, by surface:

| Event | Sent from | Carries |
|---|---|---|
| `diagram_shared` | `components/generation/diagram-export.tsx` | how the diagram was shared |
| `github_connect_started` | `components/private-repos-dialog.tsx` | `source`, `mode` |
| `github_connect_completed` / `github_connect_failed` | same | `source` |
| `recent_diagram_clicked` | `components/main-card.tsx` | the recent entry clicked |
| `video_paywall_viewed` | `components/explainer/explainer-video.tsx` | video properties |
| `video_checkout_clicked` | same | video properties |

**No repository content, no file contents, no prompts, and no API keys are sent
by these calls.** They describe UI interactions. Repository data does leave the
machine, but through the generation path (see below), not through analytics.

If session replay were enabled it would mask input fields and would not record
network requests; the code in `src/app/providers.tsx` is written for that
configuration, but replay is not enabled anywhere in this repository.

## The other outbound channels

Analytics is not the only thing that leaves the machine, and this page is not the
place where that is tracked. Two channels are active and deliberate:

- **The AI provider.** Generating a diagram sends repository content to the
  configured provider — Ollama on `127.0.0.1:11434` by default, which is this
  machine and leaves nothing.
- **GitHub's public API.** `api.github.com` is read for repository metadata,
  file trees and avatars.

Everything else (R2, Upstash, Stripe, Resend, IndexNow, Cloudflare, Vercel) is
env-gated and unconfigured, so the code paths are unreachable. Those are
hosted-service integrations with nothing behind them; they are removed with the
rest of the hosted stack rather than documented as if they worked.