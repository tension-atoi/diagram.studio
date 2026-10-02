import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("~/components/main-card", () => ({
  default: () => <div data-testid="main-card" />,
}));
vi.mock("~/components/hero", () => ({
  default: () => <div data-testid="hero" />,
}));

import HomePage, { metadata } from "./page";

describe("home page", () => {
  afterEach(cleanup);

  it("describes the diagram studio and drops the hosted URL-trick pitch", () => {
    // The rebranded fork's own title/description, not the gitdiagram.com one.
    expect(metadata).toMatchObject({
      title: "gnu.in.labs / diagram studio",
      description:
        "Inspect, map, and navigate any codebase with deterministic architecture diagrams.",
    });

    render(<HomePage />);
    expect(screen.getByTestId("hero")).toBeInTheDocument();
    expect(screen.getByTestId("main-card")).toBeInTheDocument();

    // No JSON-LD: the hosted gitdiagram.com WebApplication / "replace hub with
    // diagram" URL trick no longer exists, and the home page shows no FAQ.
    expect(
      document.querySelector('script[type="application/ld+json"]'),
    ).toBeNull();
  });
});
