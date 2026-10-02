import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useGitHubConnectResult } from "~/hooks/use-github-connect-result";

afterEach(() => {
  window.history.replaceState(null, "", "/");
  vi.clearAllMocks();
});

describe("useGitHubConnectResult", () => {
  it("reports a finished sign-in once and cleans the address", async () => {
    window.history.replaceState(null, "", "/octo/app?github=connected");

    const { result } = renderHook(() => useGitHubConnectResult("repo"));

    await waitFor(() =>
      expect(result.current[0]).toEqual({
        status: "connected",
        source: "repo",
      }),
    );
    expect(window.location.pathname + window.location.search).toBe("/octo/app");
  });

  it("reports why a sign-in failed", async () => {
    window.history.replaceState(null, "", "/?github=denied&github_from=menu");

    const { result } = renderHook(() => useGitHubConnectResult("menu"));

    await waitFor(() => expect(result.current[0]?.status).toBe("failed"));
    expect(result.current[0]).toMatchObject({
      status: "failed",
      source: "menu",
      reason: "denied",
    });
  });

  it("leaves another entry point's outcome alone", async () => {
    window.history.replaceState(
      null,
      "",
      "/?github=connected&github_from=menu",
    );

    const { result } = renderHook(() => useGitHubConnectResult("repo"));

    await Promise.resolve();
    expect(result.current[0]).toBeNull();
    expect(window.location.search).toBe("?github=connected&github_from=menu");
  });
});
