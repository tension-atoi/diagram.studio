import { describe, expect, it } from "vitest";

import { en } from "~/lib/i18n/en";
import { fr } from "~/lib/i18n/fr";
import {
  DEFAULT_LANG,
  LANGS,
  format,
  isLang,
  messagesFor,
  translate,
  type MessageKey,
} from "~/lib/i18n";

/**
 * The only keys allowed to carry the same string in both languages: the two
 * language codes, and "cache", "info" and "zoom", which are French words too.
 * Anything else that repeats its English value is an untranslated string.
 */
const IDENTICAL_BY_DESIGN = new Set<MessageKey>([
  "settings.languageEnglishShort",
  "settings.languageFrenchShort",
  "titlebar.cache",
  "toolbar.info",
  "toolbar.zoom",
]);

const keys = Object.keys(en) as MessageKey[];
const placeholders = (value: string) => (value.match(/\{\w+\}/g) ?? []).sort();

describe("message catalogues", () => {
  it("ships exactly the English key set in French", () => {
    // The `Messages` type already fails the build on a missing key; this pins
    // the runtime view of the same invariant.
    expect(Object.keys(fr).sort()).toEqual([...keys].sort());
  });

  it("gives every key a French wording, except where identical by design", () => {
    const untranslated = keys.filter(
      (key) => fr[key] === en[key] && !IDENTICAL_BY_DESIGN.has(key),
    );
    expect(untranslated).toEqual([]);
  });

  it("has no empty value", () => {
    for (const key of keys) {
      expect(en[key].trim(), `en: ${key}`).not.toBe("");
      expect(fr[key].trim(), `fr: ${key}`).not.toBe("");
    }
  });

  it("keeps the {placeholders} of a template in both languages", () => {
    for (const key of keys) {
      expect(placeholders(fr[key]), key).toEqual(placeholders(en[key]));
    }
  });
});

describe("translate", () => {
  it("returns the French value for every key", () => {
    for (const key of keys) {
      expect(translate("fr", key)).toBe(fr[key]);
    }
  });

  it("returns the English value for every key", () => {
    for (const key of keys) {
      expect(translate("en", key)).toBe(en[key]);
    }
  });

  it("defaults to English", () => {
    expect(DEFAULT_LANG).toBe("en");
    expect(translate(DEFAULT_LANG, "mainCard.submit")).toBe(
      en["mainCard.submit"],
    );
  });

  it("hands out the whole dictionary per language", () => {
    expect(messagesFor("en")).toBe(en);
    expect(messagesFor("fr")).toBe(fr);
  });
});

describe("isLang", () => {
  it("accepts every supported language", () => {
    expect([...LANGS]).toEqual(["en", "fr"]);
    for (const lang of LANGS) {
      expect(isLang(lang)).toBe(true);
    }
  });

  it("rejects anything that is not a supported language", () => {
    for (const value of [
      "de",
      "fr-FR",
      "EN",
      "Fr",
      "",
      " en",
      null,
      undefined,
      42,
      true,
      ["en"],
      { lang: "fr" },
    ]) {
      expect(isLang(value), String(value)).toBe(false);
    }
  });
});

describe("format", () => {
  it("interpolates {placeholders}", () => {
    expect(format("All Models ({count})", { count: 6 })).toBe("All Models (6)");
    expect(format("{a} then {b}", { a: "one", b: "two" })).toBe("one then two");
  });

  it("repeats a placeholder and accepts numbers", () => {
    expect(format("{n}/{n}", { n: 3 })).toBe("3/3");
  });

  it("leaves an unknown placeholder untouched", () => {
    expect(format("Hello {name}, {other}", { name: "Ada" })).toBe(
      "Hello Ada, {other}",
    );
  });

  it("returns a template without placeholders unchanged", () => {
    expect(format("Régénérer", {})).toBe("Régénérer");
  });

  it("fills the JEV audit title in both languages", () => {
    const values = { style: "layered", verified: 12, pruned: 3 };
    expect(format(translate("en", "toolbar.jevAuditTitle"), values)).toBe(
      "layered · 12 verified · 3 pruned",
    );
    expect(format(translate("fr", "toolbar.jevAuditTitle"), values)).toBe(
      "layered · 12 arêtes vérifiées · 3 arêtes élaguées",
    );
  });
});
