import { describe, expect, it } from "vitest";
import {
  isLocale,
  localePath,
  localizeGenre,
  locales,
  messages,
} from "@/lib/i18n";

describe("interface localization", () => {
  it("keeps every supported dictionary structurally complete", () => {
    const englishKeys = Object.keys(messages.en);
    for (const locale of locales)
      expect(Object.keys(messages[locale])).toEqual(englishKeys);
  });

  it("validates locales and creates localized paths", () => {
    expect(isLocale("ja")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(localePath("ja", "/browse")).toBe("/ja/browse");
    expect(localePath("en")).toBe("/en");
  });

  it("translates catalog taxonomy without changing stored values", () => {
    expect(localizeGenre("ja", "Fantasy")).toBe("ファンタジー");
    expect(localizeGenre("en", "Fantasy")).toBe("Fantasy");
  });
});
