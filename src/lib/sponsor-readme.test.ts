// @vitest-environment node
import { readFileSync } from "node:fs";
import { format } from "prettier";
import { describe, expect, it } from "vitest";
import { coderabbitCampaign, sentCampaign } from "./sponsor-campaign";
import { sponsorCreatives } from "./sponsor-creative";
import { updateSponsorReadme } from "./sponsor-readme";

const root = new URL("../../", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), "utf8");

describe("sponsor README block", () => {
  it.each([
    ["Sent", Date.parse(sentCampaign.startsAt)],
    ["CodeRabbit", Date.parse(coderabbitCampaign.startsAt)],
    ["no campaign", Date.parse(coderabbitCampaign.endsAt)],
  ])("is already Prettier-formatted for %s", async (_, now) => {
    const readme = updateSponsorReadme(
      "# Project\n\n<!-- sponsor:start -->\nold ad\n<!-- sponsor:end -->\n\nText\n",
      now,
    );
    expect(await format(readme, { parser: "markdown" })).toBe(readme);
  });

  // The sponsor programme is not running: the README carries no ad block, and
  // the job that maintained it is gone. The generator still works, so the tests
  // below cover it against a synthetic README rather than the committed one.
  it("leaves a README with no sponsor block untouched", () => {
    const readme = read("README.md");
    expect(readme).not.toContain("<!-- sponsor:start -->");
    expect(readme).not.toContain("<!-- sponsor:end -->");
  });

  it("takes the README logo width from the creative", () => {
    const readme = updateSponsorReadme(
      "<!-- sponsor:start --><!-- sponsor:end -->",
      Date.parse(coderabbitCampaign.startsAt),
    );
    expect(readme).toContain(
      `width="${sponsorCreatives[coderabbitCampaign.id].logo.readmeWidth}"`,
    );
  });

  // These modules stay importable by a bare Bun with no `bun install` and no
  // path alias, so the sponsor block can be regenerated without the app's
  // toolchain. The workflow that ran them is gone; the guard stays.
  it("keeps the README block's import graph free of packages and aliases", () => {
    const files = [
      "src/lib/sponsor-readme.ts",
      "src/lib/sponsor-campaign.ts",
      "src/lib/sponsor-creative.ts",
    ];
    for (const file of files) {
      const specifiers = [
        ...read(file).matchAll(/\bfrom\s+["']([^"']+)["']/g),
      ].map(([, specifier]) => specifier!);
      for (const specifier of specifiers) {
        expect(
          /^(\.{1,2}\/|node:)/.test(specifier),
          `${file} imports ${specifier}`,
        ).toBe(true);
        if (specifier.startsWith(".")) {
          expect(files).toContain(`src/lib/${specifier.slice(2)}.ts`);
        }
      }
    }
  });
});
