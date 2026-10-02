# ADR: an embedded local model engine

Date: 2026-10-02 · Status: accepted, not yet built

## Context

The studio draws diagrams with an AI model. Today the default is Ollama on
`127.0.0.1:11434`, which is the right default — nothing leaves the machine —
but it makes the app depend on a program the user has to install and manage
separately. `ollama serve`, a pulled model, a daemon that may or may not be
running: three ways for the app to be unusable on a fresh machine.

The studio is a packaged desktop application. It should carry its own way to
run a model locally, for users who want the whole thing to work from the
installer, while leaving the choice of a hosted provider open.

## The constraint that shaped this

The generation client calls **only** the OpenAI Responses API
(`client.responses.create`, `src/server/generate/openai.ts`). There is no
`chat/completions` fallback anywhere in the tree.

So an embedded engine must expose `/v1/responses`. llama.cpp does not;
litellm does.

## Decision

**Two packages.** The base package (AppImage, deb, tar.gz) is unchanged. A full
package adds the engine binary. Users choose at download time or in settings.

**llama.cpp, supervised by the app.** Electron starts it the same way it
already starts the Next server: spawn, wait until it answers, kill it on quit.
The user never launches anything. Ollama's opposite — detected, never started —
stays as it is, because that is the right model for something the user owns.

**A shim route for `/v1/responses`.** The app is already an HTTP server, so the
adapter is a route on it, translating the Responses call into llama.cpp's
chat/completions. litellm would do exactly this and nothing more, at ~500 MB,
a Python runtime dependency and a multi-second startup. The shim is a few dozen
lines and no new runtime.

**The shim is mounted only when the local engine is the chosen provider.** With
Ollama or a hosted API selected, the route is simply absent. The base package
never exposes it.

**The model is a `.gguf` the user picks.** Not downloaded, not bundled. The app
points llama.cpp at a file on disk. This is what makes "any compatible local
model" true rather than aspirational.

**Models live under the cache**, beside the diagram cache:
`~/.cache/gnu-in-labs-diagram-studio/models/`. Worth remembering: the cache is
wiped by anyone who clears it, and a model is not a cache entry. The
userData-vs-cache call was deliberate and this is its cost.

**The engine is isolated.** It sees only what the app hands it — a prompt and
repository content — on its own port. No access to disk, no outbound network,
no keys. It does not read the app's configuration.

**Selection is verified, not trusted.** The app checks a candidate `.gguf`
before accepting it: context window at least what generation needs (the current
default model declares 8,192) and support for structured output, which the
architecture stage requires (`outputSchema` on the stream route). A refusal
reads "4k of context, 8k needed", not a generation failure twenty seconds in.

## Consequences

- Six artifacts instead of three (three targets × two variants).
- The engine needs its own lifecycle: spawn, readiness, shutdown, crash
  recovery, port allocation alongside the app's own.
- `/v1/responses` support must be maintained by hand. When the app's generation
  client starts using another API surface, the shim grows with it. That is the
  price of not taking a Python runtime dependency, paid knowingly.
- An untested `.gguf` remains possible for a user who skips verification; the
  error surfaces at generation time.

## Alternatives rejected

| Option | Why not |
|---|---|
| litellm embedded | Python runtime, ~500 MB, slow start, does one job |
| litellm in a container | Requires podman/docker on the machine |
| Bundle the model | 20+ GB in a package |
| Download the model on first run | Two artifacts and a picker; a path is enough |
| Force `/v1/responses` on the engine | Removes the user's freedom to pick a backend |
| Verify nothing at selection | Fails late and opaquely |

## Not decided here

- Windows and macOS engines (this decision is Linux, like the packages).
- Whether the base package ever ships any engine.
- Whether the model picker becomes part of the wider settings work.