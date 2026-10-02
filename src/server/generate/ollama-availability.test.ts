import { afterEach, describe, expect, it, vi } from "vitest";

// `server-only` throws on import outside a React Server Component graph; this is
// a server module under test, so the guard is stubbed for the test run only.
vi.mock("server-only", () => ({}));

import { checkOllama } from "./ollama-availability";

const BASE = "http://127.0.0.1:11434";

function answerWith(body: unknown, init: ResponseInit = { status: 200 }) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify(body), init)),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("checkOllama", () => {
  it("reports a reachable daemon holding the configured model", async () => {
    answerWith({ models: [{ name: "qwen3.6:35b-studio" }] });

    await expect(checkOllama()).resolves.toEqual({
      reachable: true,
      model: "qwen3.6:35b-studio",
      modelMissing: false,
      detail: `Ollama at ${BASE} is up with qwen3.6:35b-studio.`,
    });
  });

  it("probes the native endpoint, dropping the OpenAI-compatible /v1", async () => {
    answerWith({ models: [{ name: "qwen3.6:35b-studio" }] });

    await checkOllama();

    expect(fetch).toHaveBeenCalledWith(`${BASE}/api/tags`, expect.anything());
  });

  it("treats a tagged model name as the pulled model", async () => {
    answerWith({ models: [{ name: "qwen3.6:35b-studio:8b-instruct" }] });

    const availability = await checkOllama();

    expect(availability.modelMissing).toBe(false);
  });

  it("says how to pull a model the daemon does not have", async () => {
    answerWith({ models: [{ name: "llama3:8b" }] });

    const availability = await checkOllama();

    expect(availability).toMatchObject({
      reachable: true,
      modelMissing: true,
    });
    expect(availability.detail).toContain("ollama pull qwen3.6:35b-studio");
  });

  it("reports the endpoint when the daemon refuses the connection", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("fetch failed");
      }),
    );

    const availability = await checkOllama();

    expect(availability.reachable).toBe(false);
    expect(availability.modelMissing).toBe(false);
    expect(availability.detail).toContain(BASE);
  });

  it("reports a non-2xx daemon response as unreachable", async () => {
    answerWith({}, { status: 500 });

    const availability = await checkOllama();

    expect(availability.reachable).toBe(false);
    expect(availability.detail).toContain("500");
  });
});
