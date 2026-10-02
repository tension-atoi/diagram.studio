import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";

import { DesktopStatusBar } from "./desktop-status-bar";

function runtimeResponse(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200 });
}

const UP = {
  engine: {
    reachable: true,
    model: "qwen3.6:35b-studio",
    modelMissing: false,
    detail: "Ollama at http://127.0.0.1:11434 is up with qwen3.6:35b-studio.",
  },
  verifier: { configured: false },
};

afterEach(() => {
  // This project does not enable vitest globals, so Testing Library's automatic
  // cleanup never registers itself and renders would pile up between tests.
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("DesktopStatusBar", () => {
  it("asks the server instead of asserting the engine is up", async () => {
    const fetchMock = vi.fn(async () => runtimeResponse(UP));
    vi.stubGlobal("fetch", fetchMock);

    render(<DesktopStatusBar />);

    await waitFor(() => {
      expect(screen.getByText(/OLLAMA LOCAL : 11434/)).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/runtime",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("stays neutral until the first answer arrives", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );

    render(<DesktopStatusBar />);

    expect(screen.getByText("CHECKING ENGINE")).toBeInTheDocument();
    expect(screen.queryByText(/OLLAMA LOCAL/)).not.toBeInTheDocument();
  });

  it("says when Ollama is not answering, and says what to run", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        runtimeResponse({
          ...UP,
          engine: {
            reachable: false,
            model: "qwen3.6:35b-studio",
            modelMissing: false,
            detail:
              "Ollama is not answering on http://127.0.0.1:11434 (fetch failed).",
          },
        }),
      ),
    );

    render(<DesktopStatusBar />);

    await waitFor(() => {
      expect(screen.getByText("OLLAMA NOT REACHING")).toBeInTheDocument();
    });
    expect(
      screen.getByTitle(
        /Ollama is not answering on http:\/\/127\.0\.0\.1:11434/,
      ),
    ).toBeInTheDocument();
  });

  it("distinguishes a model that is not pulled from an unreachable daemon", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        runtimeResponse({
          ...UP,
          engine: {
            reachable: true,
            model: "qwen3.6:35b-studio",
            modelMissing: true,
            detail: "Ollama is up but qwen3.6:35b-studio is not pulled.",
          },
        }),
      ),
    );

    render(<DesktopStatusBar />);

    await waitFor(() => {
      expect(screen.getByText("MODEL NOT PULLED")).toBeInTheDocument();
    });
  });

  it("reports the verifier as off when no key is configured", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => runtimeResponse(UP)),
    );

    render(<DesktopStatusBar />);

    await waitFor(() => {
      expect(screen.getByText("JEV VERIFIER OFF")).toBeInTheDocument();
    });
  });

  it("reports the verifier as active only when the server says a key exists", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        runtimeResponse({ ...UP, verifier: { configured: true } }),
      ),
    );

    render(<DesktopStatusBar />);

    await waitFor(() => {
      expect(screen.getByText("JEV S1 VERIFIER ACTIVE")).toBeInTheDocument();
    });
  });

  it("keeps the last verdict when a later probe fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(runtimeResponse(UP))
      .mockResolvedValueOnce(new Response("nope", { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<DesktopStatusBar />);

    await waitFor(() => {
      expect(screen.getByText(/OLLAMA LOCAL : 11434/)).toBeInTheDocument();
    });
    expect(screen.getByText(/OLLAMA LOCAL : 11434/)).toBeInTheDocument();
  });

  it("points at the renamed cache directory", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );

    render(<DesktopStatusBar />);

    expect(
      screen.getByText("cache: ~/.cache/gnu-in-labs-diagram-studio/"),
    ).toBeInTheDocument();
  });
});
