// @vitest-environment node
import fs from "node:fs";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  CACHE_ROOT,
  listLocalDiagrams,
  readLocalDiagram,
  saveLocalDiagram,
} from "./local-disk";

function write(owner: string, repo: string, data: unknown): void {
  const dir = path.join(CACHE_ROOT, owner);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, `${repo}.json`),
    JSON.stringify(data),
    "utf-8",
  );
}

const DIAGRAM = "flowchart TD\n  A --> B";

beforeEach(() => {
  fs.rmSync(CACHE_ROOT, { recursive: true, force: true });
});

afterEach(() => {
  fs.rmSync(CACHE_ROOT, { recursive: true, force: true });
});

describe("listLocalDiagrams", () => {
  it("is empty when nothing has ever been drawn", () => {
    expect(listLocalDiagrams()).toEqual([]);
  });

  it("lists what is stored, newest first", () => {
    write("pallets", "flask", { diagram: DIAGRAM, visibility: "public" });
    write("tension-atoi", "gnosix", {
      diagram: DIAGRAM,
      visibility: "private",
    });

    const entries = listLocalDiagrams();
    expect(entries.map((e) => `${e.username}/${e.repo}`).sort()).toEqual([
      "pallets/flask",
      "tension-atoi/gnosix",
    ]);
    expect(entries.every((e) => typeof e.lastSuccessfulAt === "string")).toBe(
      true,
    );

    const dates = entries.map((e) => e.lastSuccessfulAt ?? "");
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  it("reads the visibility the stored diagram was written with", () => {
    write("pallets", "flask", { diagram: DIAGRAM, visibility: "public" });
    write("tension-atoi", "gnosix", {
      diagram: DIAGRAM,
      visibility: "private",
    });
    write("acme", "unknown", { diagram: DIAGRAM });

    const byRepo = Object.fromEntries(
      listLocalDiagrams().map((e) => [e.repo, e.visibility]),
    );
    expect(byRepo).toEqual({
      flask: "public",
      gnosix: "private",
      unknown: null,
    });
  });

  it("skips a file whose name could not be a repository path", () => {
    write("pallets", "flask", { diagram: DIAGRAM });
    const dir = path.join(CACHE_ROOT, "pallets");
    fs.writeFileSync(path.join(dir, "not json.txt"), "ignored", "utf-8");
    fs.writeFileSync(path.join(dir, "../escape.json"), "{}", "utf-8");
    // An owner directory that is not a GitHub login.
    fs.mkdirSync(path.join(CACHE_ROOT, "Not An Owner"), { recursive: true });
    fs.writeFileSync(
      path.join(CACHE_ROOT, "Not An Owner", "x.json"),
      "{}",
      "utf-8",
    );

    expect(listLocalDiagrams().map((e) => e.repo)).toEqual(["flask"]);
  });

  it("still lists a repository whose file cannot be parsed", () => {
    write("pallets", "flask", { diagram: DIAGRAM });
    fs.writeFileSync(
      path.join(CACHE_ROOT, "pallets", "broken.json"),
      "{",
      "utf-8",
    );

    const entries = listLocalDiagrams();
    expect(entries.map((e) => e.repo).sort()).toEqual(["broken", "flask"]);
    expect(entries.find((e) => e.repo === "broken")?.visibility).toBeNull();
  });

  it("ignores a file that is really a directory", () => {
    write("pallets", "flask", { diagram: DIAGRAM });
    fs.mkdirSync(path.join(CACHE_ROOT, "pallets", "adir.json"));

    expect(listLocalDiagrams().map((e) => e.repo)).toEqual(["flask"]);
  });
});

describe("the listing and the reader agree", () => {
  it("names a diagram the read path can then open", () => {
    saveLocalDiagram("Pallets", "Flask", { diagram: DIAGRAM });

    const [entry] = listLocalDiagrams();
    expect(entry).toMatchObject({ username: "pallets", repo: "flask" });
    expect(readLocalDiagram("pallets", "flask")?.diagram).toBe(DIAGRAM);
  });
});
