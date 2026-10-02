import { cleanup, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, expect, it, vi } from "vitest";
import type { BrowsePageResult } from "~/features/browse/catalog";

const sponsorMounts = vi.hoisted(() => ({ count: 0 }));
vi.mock("~/components/sponsor-slot", () => ({
  SponsorCatalogRow: function SponsorCatalogRow() {
    useEffect(() => {
      sponsorMounts.count += 1;
    }, []);
    return (
      <tr data-testid="sponsor-row">
        <td />
      </tr>
    );
  },
}));

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

it("keeps only the listing rows, without an ad row, while the listings change", () => {
  sponsorMounts.count = 0;
  const view = render(results(page(["a", "b", "c"])));
  const rows = () =>
    screen
      .getAllByRole("row")
      .slice(1)
      .map((row) => row.dataset.testid ?? row.textContent?.split("owner/")[1]);

  // One row per listing. There is no ad row: SponsorCatalogRow is
  // intentionally not mounted while the owner has no sponsor (yet).
  const expectListings = (expected: string[]) => {
    expect(rows()).toHaveLength(expected.length);
    expected.forEach((repo, index) => {
      expect(rows()[index]?.startsWith(repo)).toBe(true);
    });
    expect(screen.queryByTestId("sponsor-row")).toBeNull();
    expect(sponsorMounts.count).toBe(0);
  };

  expectListings(["a", "b", "c"]);

  // A search, filter, sort or page change replaces the listing at index 1.
  view.rerender(results(page(["x", "y"])));
  expectListings(["x", "y"]);

  view.rerender(results(page(["b", "a", "z"])));
  expectListings(["b", "a", "z"]);

  view.rerender(results(page(["only"])));
  expectListings(["only"]);
  expect(screen.queryByTestId("sponsor-row")).toBeNull();
});
