import { afterEach, describe, expect, it, vi } from "vitest";

// `server-only` throws on import outside a React Server Component graph; this is
// a server module under test, so the guard is stubbed for the test run only.
vi.mock("server-only", () => ({}));

vi.mock("~/server/generate/ollama-availability", () => ({
  checkOllama: vi.fn(async () => ({
    reachable: true,
    model: "qwen3.6:35b-studio",
    modelMissing: false,
    detail: "Ollama at http://127.0.0.1:11434 is up with qwen3.6:35b-studio.",
  })),
}));

vi.mock("~/server/typesafe/client", () => ({
  isTypeSafeConfigured: vi.fn(() => false),
}));

import { checkRuntime } from "./runtime-status";
import { isTypeSafeConfigured } from "~/server/typesafe/client";

afterEach(() => {
  vi.mocked(isTypeSafeConfigured).mockReturnValue(false);
});

describe("checkRuntime", () => {
  it("reports the probed engine state", async () => {
    const status = await checkRuntime();

    expect(status.engine).toMatchObject({
      reachable: true,
      modelMissing: false,
    });
  });

  it("reports the verifier as unconfigured when no key is set", async () => {
    await expect(checkRuntime()).resolves.toMatchObject({
      verifier: { configured: false },
    });
  });

  it("reports the verifier as configured from the same gate the client uses", async () => {
    vi.mocked(isTypeSafeConfigured).mockReturnValue(true);

    await expect(checkRuntime()).resolves.toMatchObject({
      verifier: { configured: true },
    });
  });
});
