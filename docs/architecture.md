# Architecture

[← README](../README.md)

## Stack

- **Application:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, and Radix UI
- **Generation API:** same-origin Next.js Route Handlers
- **Desktop shell:** Electron, which starts that server as a local service on `127.0.0.1`
- **Storage:** the local disk, by default. Cloudflare R2 is available and off
- **Coordination:** Upstash Redis, for shared rate limits and cancellation. Off by default
- **AI:** Ollama by default; OpenAI or OpenRouter through `AI_PROVIDER`

There is no separate backend implementation, no database, and no deployment.

## Runtime

Electron is the process that owns the app (`electron/main.cjs`). On first launch it
asks which local port to listen on — `7421` by default — stores the answer in
`config.json` in the application-data directory, and starts the Next server
built with `output: "standalone"`. It re-uses the Electron binary as the Node
runtime (`ELECTRON_RUN_AS_NODE`), so a packaged app needs no `node` installed.

`Dockerfile` and `railway.json` are unreferenced; they are removed with the rest
of the hosted stack.

The endpoints:

- `/api/generate/cost` estimates a run after bounded GitHub ingestion, same-origin and rate limited.
- `/api/generate/stream` streams Server-Sent Events for explanation and graph progress.
- `/api/generate/cancel` records authenticated, same-origin cancellation signals.
- `/api/diagram-state` reads and writes the persisted result contract.
- `/api/healthz` provides a lightweight health check.
- `/mcp` serves the read-only MCP endpoint.

Generation uses a 300-second deadline with a shorter application deadline so
persistence still has time to finish. Requests use explicit upstream deadlines,
retries, structured logs, heartbeats, and cancellation rather than process-local
state.

The default pipeline makes one request at low reasoning to produce a
source-grounded graph and a short streamed overview. Graphs are validated and
compiled deterministically; additional calls are reserved for structural repairs.
Explicit model overrides and OpenRouter retain the two-stage pipeline. Output
token estimates reserve quota but do not cap provider output.

## How generation works

1. The studio fetches the repository's default branch, recursive tree, and README through the GitHub API. When GitHub returns a partial (truncated) tree for a very large repository, the listing is kept and top-level folders it left out are read one level deep, so big repositories still get a diagram; the model only sees a bounded excerpt of the tree either way. An oversized README is rejected before model work begins.
2. It fetches bounded, integrity-checked source excerpts. Selection favors substantive runtime modules, distributes excerpts across long files, and preserves import bindings for sampled calls.
3. One request streams a short architecture overview followed by a strict graph: groups, nodes, edges, shapes, labels, and repository paths. Explicit model overrides and user-supplied keys retain the separate explanation/graph flow.
4. The server validates identifiers, graph connectivity, limits, and every linked path against the actual repository. Invalid output is retried with focused feedback.
5. A deterministic compiler converts the validated AST to Mermaid with total text escaping and GitHub-only links.
6. The browser sanitizes the source, renders Mermaid with `securityLevel: "antiscript"` and `htmlLabels: false`, sanitizes the resulting SVG with DOMPurify, and enforces the GitHub-only link allowlist again. Mermaid's `strict` mode is not usable because it disables the `click` directives that make nodes link to GitHub, so the allowlist enforcement carries that weight.
7. Successful artifacts and terminal audit state are persisted so later visits can reopen the diagram without another model call.

The full Mermaid parser remains in the test suite as a compiler contract test. It
is deliberately not loaded into the production generation function, keeping the
server bundle small without weakening diagram validation or browser safety.

## State

- **Successful public generations:** `~/.cache/gnu-in-labs-diagram-studio/<owner>/<repo>.json`, or an R2 object keyed by repository when R2 is configured
- **Successful private generations:** a separate namespace derived with `CACHE_KEY_SECRET`
- **Active cancellation tokens:** Upstash Redis when configured
- **Terminal failures without a saved artifact:** short-lived Redis state
- **Concurrent writes:** newest-session-wins persistence