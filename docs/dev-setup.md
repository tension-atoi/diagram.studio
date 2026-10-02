# Local development setup

gnu.in.labs / diagram studio is one Next.js application. The UI and generation API run
together; no second backend process is required. In the packaged desktop build,
Electron starts that same application as its local server.

## Prerequisites

- Node.js 22: `22.12` or newer for Next.js and the tooling, and `22.22.2` or newer to
  run the tests (jsdom 30). Node `24.15` or newer also works locally.
- Bun `1.3.14`, the version pinned in `packageManager` and the `Dockerfile`. Do not
  move to Bun 1.4 yet: it rewrites `bun.lock`.

```bash
node --version
bun --version
```

## Install

```bash
bun install
cp .env.example .env
```

Use `bun ci` when you want an exact frozen-lockfile install.

`bun install` also turns on the versioned git hooks in `.githooks/` (the `prepare`
script sets `core.hooksPath`). The pre-push hook runs the fast checks (formatting,
lint, typecheck and knip) in a few seconds, so it is not bypassed with
`git push --no-verify`.

There is no hosted CI in this repository. `bun run verify` is the bench; a run
anywhere else is not evidence.

## Configure

`.env.example` lists every setting with its default and is the source of truth; this section covers the groups.

Set these storage and coordination variables in `.env`:

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_PUBLIC_BUCKET`
- `R2_PRIVATE_BUCKET`
- `CACHE_KEY_SECRET`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Choose one AI provider:

- OpenAI: `AI_PROVIDER=openai` and `OPENAI_API_KEY`
- OpenRouter: `AI_PROVIDER=openrouter` and `OPENROUTER_API_KEY`

Optional generation controls include:

- `OPENAI_MODEL`
- `OPENAI_COMPLIMENTARY_GATE_ENABLED`
- `OPENAI_COMPLIMENTARY_DAILY_LIMIT_TOKENS`
- `OPENAI_COMPLIMENTARY_MODEL_FAMILY`
- `OPENROUTER_MODEL`
- `OPENROUTER_SITE_URL`
- `OPENROUTER_APP_NAME`
- `GENERATION_RATE_LIMIT_MAX` / `GENERATION_RATE_LIMIT_WINDOW_SECONDS` (per-IP limit on server-funded runs, default 8 an hour)
- `GENERATION_INFRASTRUCTURE_RATE_LIMIT_MAX` / `GENERATION_INFRASTRUCTURE_RATE_LIMIT_WINDOW_SECONDS` (per-IP limit on every caller, default 60 an hour)
- `MCP_RATE_LIMIT_MAX` / `MCP_RATE_LIMIT_WINDOW_SECONDS` (per-network limit on tool calls to the MCP server at `/mcp`, default 120 an hour; per person, with 20 times that per network, when a chat app such as ChatGPT names the person)
- `MCP_APP_ORIGIN` (where the MCP App diagram view's script loads from; the desktop
  build sets `SITE_URL` to its local origin, so the view is served by the app itself)
- `OPENAI_APPS_CHALLENGE` (the domain-verification token from OpenAI's plugin portal, served at `/.well-known/openai-apps-challenge`; or `SET` it in Redis at `openai:v1:apps-challenge`, which needs no redeploy)

Optional GitHub authentication:

- `GITHUB_PAT` for one token
- `GITHUB_PATS` for a comma- or newline-separated token pool
- `GITHUB_APP_ID` or `GITHUB_CLIENT_ID`, plus `GITHUB_PRIVATE_KEY` and `GITHUB_INSTALLATION_ID`, for GitHub App authentication
- `GITHUB_CONNECT_CLIENT_ID`, `GITHUB_CONNECT_CLIENT_SECRET`, `GITHUB_CONNECT_APP_SLUG` and `NEXT_PUBLIC_GITHUB_CONNECT=1` for "Continue with GitHub" on private repositories (a separate GitHub App; see `.env.example`)

Optional browser analytics:

- `NEXT_PUBLIC_POSTHOG_KEY`

Optional explainer videos, operator dashboard and live presence:

- `VIDEO_EXPLAINER_ENABLED=1` and `NEXT_PUBLIC_VIDEO_EXPLAINER=1` turn videos on. They need `OPENAI_API_KEY` (GPT-6.1 Sol and whisper-1) and `OPENROUTER_API_KEY` (the voice), plus `ANTHROPIC_API_KEY` while a configured video model is a Claude model (the default).
- `VIDEO_ADMIN_TOKEN` (32+ characters) signs in to `/admin` and skips the video limits. `ANTHROPIC_ADMIN_KEY` lets `/admin` show the Claude credit left.
- `NEXT_PUBLIC_PRESENCE_URL` and `PRESENCE_SECRET` connect the site to the presence worker (see [workers/presence/README.md](../workers/presence/README.md)).
- Local MP4 renders need `VIDEO_RENDER_CHROME_PATH` and must run `next dev` under Node, not Bun.
- The `VIDEO_*` limits, `SPONSOR_*` settings and `CRON_SECRET` are documented in `.env.example`.

The default OpenAI configuration is:

```dotenv
AI_PROVIDER=openai
OPENAI_MODEL=gpt-6-luna
```

An OpenRouter example:

```dotenv
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=openai/gpt-5.6-terra
OPENROUTER_SITE_URL=http://localhost:3000
OPENROUTER_APP_NAME=gnu.in.labs diagram studio
```

## Run

Web development, on port 3000:

```bash
bun run dev
```

The application is available at [http://localhost:3000](http://localhost:3000). Next.js Route Handlers under `/api/generate/*` run in the same process.

Desktop development — one command, no separate terminal:

```bash
bun run electron:dev
```

It builds the MCP app, starts `next dev` on the configured port, waits for it to
answer, then launches Electron against it. The first-launch port dialog is
skipped in dev, because the dev server owns the port.

For a production-mode web check:

```bash
bun run build
bun run start
```

## Package and run the desktop app

```bash
bun run electron:build
```

`build:electron` sets `ELECTRON_BUILD=1`, which switches `next.config.js` to
`output: "standalone"` and `images.unoptimized`, then stages `.next/static` and
`public/` into `.next/standalone` (`scripts/prepare-standalone.mjs`).
`electron-builder` then writes three targets to `dist-electron/`:

| Target | File |
|---|---|
| AppImage | `gnu.in.labs Diagram Studio-0.1.0.AppImage` |
| deb | `gnu-in-labs-diagram-studio_0.1.0_amd64.deb` |
| tar.gz | `gnu-in-labs-diagram-studio-0.1.0.tar.gz` |

The plain `bun run build` is unchanged and keeps Next's default output.

To run the packaged app, mount the AppImage (`--appimage-extract-and-run` if
FUSE is unavailable) or extract the deb with `dpkg-deb -x` and run the binary
in place. The app needs no `node` on the machine: it re-uses the Electron binary
as the Node runtime (`ELECTRON_RUN_AS_NODE`).

What the app does on launch, in order: read or create `config.json` in its
userData directory, ask once for the port if there is none, mint a 0600
`CACHE_KEY_SECRET`, migrate `~/.cache/gitdiagram` to
`~/.cache/gnu-in-labs-diagram-studio/`, spawn the standalone server, poll it
until it answers, then open the window. Server output goes to `logs/server.log`
in the same directory.

## Verify

```bash
bun run verify
```

That is the bench: `format:check`, `lint`, `typecheck`, `knip`, then `test`
twice. It runs twice on purpose — the suite wipes its cache directory before
each run, and a single green run can hide state leaking between runs. The bar
for "done" is zero failures on two consecutive runs.

Nothing outside this machine counts as evidence. There is no hosted CI in this
repository, and when workflows are introduced they will only publish builds that
were already proven locally.

The individual steps, when you want them separately:

```bash
bun run lint           # fails on any warning
bun run typecheck      # TypeScript 7, then electron/tsconfig.json for the main process
bun run format:check   # TS/JS/MDX, CSS, JSON and YAML
bun run knip           # unused files, exports and dependencies
bun audit
bun run test
bun run build
bun run check:video-tracing   # after build: video routes trace ffmpeg and Chromium only where needed, within size ceilings
bun run perf:budget           # after build: route, chunk and video engine size budgets
```

`workers/presence` has its own lockfile; check it from that folder with
`bun ci && bun run typecheck && bun run test && bun audit`.

The test suite includes real Mermaid parser contract tests for the deterministic
graph compiler, API route tests, cancellation and quota tests, storage
concurrency tests, and browser-rendering safety tests.

### Two traps worth knowing

- **Do not run the suite with `bun run --bun vitest`.** The Bun runtime's globals
  collide with jsdom's and every browser-environment test fails to start its
  worker, with `addEventListener called on an object that is not a valid instance
  of EventTarget`. `bun run test` invokes the `vitest` binary through its
  `#!/usr/bin/env node` shebang and is correct.
- **Testing Library's automatic cleanup does not register here**, because
  vitest globals are off. A component test that renders more than once per file
  must call `cleanup()` in `afterEach`, or renders from earlier tests stay in the
  document and queries match the wrong copy.

## Troubleshooting

- **Typecheck or build fails on files under `.next/dev/types`.** `tsconfig.json` includes the route type validators that `next dev` generates there, and a stale copy from an older checkout can break `bun run typecheck` and `bun run build`. Delete it with `rm -rf .next/dev`; the next `bun run dev` regenerates it.
- **MP4 renders.** `puppeteer-core` is pinned to the release built for the Chromium major that `@sparticuz/chromium` ships (see `lib/puppeteer/revisions.js` in puppeteer-core). Bump the two together, only when a new `@sparticuz/chromium` major is out; until then, skip Dependabot's puppeteer-core bumps.

## Fonts

The two interface fonts are vendored, not fetched at render time:
`public/fonts/ibm-plex-mono-{400,500,600}.woff2` and
`public/fonts/space-grotesk-variable.woff2`, with the `@font-face` rules in
`src/styles/globals.css`. Space Grotesk is a variable font, so one file covers
weights 400–700.

To change a family or a weight, edit the `FAMILIES` list in
`scripts/vendor-fonts.mjs` and re-run it:

```bash
node scripts/vendor-fonts.mjs
```

It downloads only the `latin` subset (which covers English and French),
de-duplicates identical variable files by content hash, and rewrites only the
block it owns in `globals.css`.

## Deploy

There is no deployment. The application ships as Linux packages and runs on the
machine that installed it; the server it starts listens on `127.0.0.1` only.

`Dockerfile` and `railway.json` are still in the repository and still build, but
nothing references them: they describe a container deployment that does not
exist. They are removed with the rest of the hosted stack rather than maintained
as if they did.

The one thing to know if you ever do publish something: `NEXT_PUBLIC_*` values are
compiled in at build time, not read at runtime, so they must be passed as build
arguments. The desktop build avoids that entirely by keeping them unset and
injecting `SITE_URL`, `PORT` and the secret into the spawned process.
