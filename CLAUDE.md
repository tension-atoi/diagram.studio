# CLAUDE.md

Guidance for working in this repository.

## What this is

gnu.in.labs / diagram studio turns a GitHub repository into an interactive
Mermaid architecture diagram and a written explanation of how it is put
together.
It is **one Next.js 16 App Router application** (React 19, TypeScript, Tailwind 4,
Bun). There is no separate backend — the generation API lives in Route Handlers
under `src/app/api/`.

It ships as a **Linux desktop application**. Electron starts that same Next
server as its local service on `127.0.0.1` (`electron/main.cjs`; CommonJS,
type-checked by `electron/tsconfig.json` rather than the app's).

There is no deployment. `Dockerfile` and `railway.json` are unreferenced and are
removed with the rest of the hosted stack.

## Commands

Bun is the package manager and runtime (`bun install`; `bun ci` for a frozen
lockfile).

```
bun run electron:dev       # MCP app → next dev → Electron, one command
bun run electron:build     # standalone build → AppImage, deb, tar.gz
bun run verify             # the bench: format, lint, typecheck, knip, tests ×2
bun run vendor-fonts.mjs   # re-download the vendored woff2 files
```

`bun run verify` is the only evidence that counts. There is no hosted CI; a run
anywhere else is not proof. Run the suite through `bun run test`, **not**
`bun run --bun vitest`: the Bun runtime's globals break every jsdom test.

## Architecture

### Generation pipeline (the core)

`/api/generate/stream` streams SSE through a pipeline in `src/server/generate/`:

1. **Ingestion** (`github.ts`) — default branch, recursive tree, README through
   the GitHub API. A truncated tree is kept and the folders it omitted are read
   one level deep (≤8 requests); only a README over 750 KB is rejected.
2. **Source context** (`repository-context.ts`, `source-context.ts`,
   `source-excerpt.ts`, `source-references.ts`) — rank source files (tests, e2e,
   demos and generated code excluded), read the top 12 plus up to 28 more in two
   rounds, the second following what the first imports, within a 12-second
   enrichment deadline. The prompt's source text is bounded to 48k characters
   and opens with a **SOURCE INDEX**: each file read with its reference list,
   important unread files, and a CORE MODULES checklist.
3. **Graph stage** (`graph-planner.ts`, `openai.ts`) — the model returns a
   size-bounded graph AST (groups/nodes/edges/labels/paths), validated by
   `graph.ts`: identifiers, edge endpoints, limits, and every linked path checked
   against the real tree. Each edge carries a nullable `evidencePath`. Structural
   failures are retried with focused feedback up to `MAX_GRAPH_ATTEMPTS`;
   `edge-evidence.ts` then drops citations of files the model was never shown.
4. **Compilation** (`compileDiagramGraph` in `graph.ts`) — deterministic
   AST→Mermaid with total text escaping and GitHub-only links. `mermaid.ts` is a
   re-export of a JSDOM-backed parser that is **test-only**, to keep the server
   bundle small — do not import it into production code.
5. **Client rendering** (`components/mermaid-diagram.tsx`,
   `features/diagram/mermaid-security.ts`) — sanitize, render with
   `securityLevel: "antiscript"`, sanitize the SVG with DOMPurify, re-enforce the
   GitHub-only link allowlist. `strict` is unusable: it disables the `click`
   directives the diagram depends on.

`model-config.ts` picks the provider from `AI_PROVIDER` and reads `ACTIVE_MODEL`
(the provider-agnostic key the settings dialog persists).

### The model speaks one API

The client calls **only** the OpenAI **Responses** API
(`client.responses.create`). There is no `chat/completions` fallback anywhere.
Any new engine must therefore expose `/v1/responses` — see
`docs/decisions/embedded-local-engine.md`.

Ollama on `127.0.0.1:11434` is the default, so nothing leaves the machine.
`/api/runtime` probes it and reports reachability and whether the model is
pulled; the status bar shows that verdict rather than asserting one.

### Storage

Diagrams live on disk: `~/.cache/gnu-in-labs-diagram-studio/<owner>/<repo>.json`
(`storage/local-disk.ts`, `CACHE_ROOT`, overridable with `DIAGRAM_STUDIO_CACHE_DIR`).
The app never writes next to its bundle, which is read-only.

`storage/` also holds the R2 artifact store and the Upstash Redis client. Both
are env-gated and unconfigured, so the local path is what runs. A **separate
private namespace** is derived from `CACHE_KEY_SECRET` (`cache-key.ts`) for
private repositories, and that secret is minted per install by Electron at 0600.

### The MCP server

`/mcp` serves a read-only MCP server on the local port the first-launch dialog
confirmed (`MCP_URL` in `src/lib/site.ts`). `handler.ts` serves stateless
streamable HTTP; `server.ts` holds one read-only tool — `get_repository_diagram` —
and the instructions agents read. `app.ts` registers the inline diagram view.

### Layering

- `src/server/` — server-only code behind `server-only`: generation pipeline,
  GitHub auth, storage, HTTP guards, OG images.
- `src/server/http/` — mutating routes require same-origin requests;
  `client-ip.ts` is for rate limiting only and is never an authentication
  signal.
- `src/features/` — shared domain logic per feature. The graph AST types in
  `features/diagram/graph.ts` are used by both server validation and client
  rendering.
- `src/hooks/useDiagram.ts` + `src/hooks/diagram/` — the client generation
  lifecycle (cost check → stream → render → persist).
- `src/lib/i18n/` — the two language catalogues. `en.ts` is the source of truth
  and `fr.ts` is typed as `Messages`, so a missing French string is a type
  error. Components read `t()` from `useStudioLanguage()`.

### Two services remain, both optional and both off

**R2 and Upstash.** `storage/r2.ts` and `storage/upstash.ts` are the only
survivors of the hosted stack, kept because they are how a diagram moves off
this machine and how shared rate limits work. Both are env-gated and unset, so
`storage/local-disk.ts` is what runs. They are not maintained as if they were
the default. Do not make anything depend on them being configured.

## Environment

Copy `.env.example` → `.env`. For generation you need `CACHE_KEY_SECRET` and one
AI provider. `docs/dev-setup.md` groups the settings and explains which are
inert.

## Conventions

- Prettier with `prettier-plugin-tailwindcss` (`bun run format:write`); ESLint 10
  flat config (`eslint.config.mjs`).
- Server code must not leak into client bundles — keep it under `src/server/`
  behind `server-only`.
- Diagram output safety is defense-in-depth: server validation → deterministic
  compiler → client sanitization. Change one layer, keep the others intact.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->