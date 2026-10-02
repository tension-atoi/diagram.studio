import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { BrowsePageResult } from "~/features/browse/catalog";

import { BrowseCatalogResults } from "./browse-catalog-results";

afterEach(cleanup);

function page(repos: string[]): BrowsePageResult {
  return {
    items: repos.map((repo) => ({
      username: "owner",
      repo,
      lastSuccessfulAt: "2026-09-20T12:00:00.000Z",
      stargazerCount: 10,
    })),
    total: repos.length,
    page: 1,
    pageSize: 20,
    totalPages: 1,
    sort: "stars_desc",
    q: "",
    minStars: 0,
  };
}

function results(result: BrowsePageResult) {
  return (
    <BrowseCatalogResults
      closeHoverPreview={() => {}}
      desktopHoverEnabled={false}
      handlePageChange={() => {}}
      handleRepoHoverMove={() => {}}
      handleRepoHoverStart={() => {}}
      hoverPreview={null}
      hoverPreviewDiagram={null}
      hoverPreviewElementRef={{ current: null }}
      hoverPreviewStatus="idle"
      result={result}
    />
  );
}

it("keeps one row per listing while the listings change", () => {
  const view = render(results(page(["a", "b", "c"])));
  const rows = () =>
    screen
      .getAllByRole("row")
      .slice(1)
      .map((row) => row.dataset.testid ?? row.textContent?.split("owner/")[1]);

  const expectListings = (expected: string[]) => {
    expect(rows()).toHaveLength(expected.length);
    expected.forEach((repo, index) => {
      expect(rows()[index]?.startsWith(repo)).toBe(true);
    });
  };

  expectListings(["a", "b", "c"]);

  // A search, filter, sort or page change replaces the listing at index 1.
  view.rerender(results(page(["x", "y"])));
  expectListings(["x", "y"]);

  view.rerender(results(page(["b", "a", "z"])));
  expectListings(["b", "a", "z"]);

  view.rerender(results(page(["only"])));
  expectListings(["only"]);
});
