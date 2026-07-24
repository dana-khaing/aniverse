import { describe, expect, it } from "vitest";
import {
  creatorTranslationSchema,
  translationCompleteness,
} from "./creator-translations";

describe("creator translated metadata", () => {
  it("validates English and Japanese title metadata", () => {
    expect(
      creatorTranslationSchema.parse({
        titleId: "987f6543-e21b-43d2-a456-426614174000",
        locale: "ja",
        name: "月の庭",
        nativeName: "Moon Garden",
        synopsis: "星明かりの庭で始まる物語。",
        seoTitle: "月の庭を見る",
        seoDescription: "月の庭の最新エピソードを配信中。",
      }).locale,
    ).toBe("ja");
  });

  it("reports completion and rejects unsupported locales", () => {
    expect(
      translationCompleteness({
        name: "Moon Garden",
        synopsis: "A story.",
      }),
    ).toBe(50);
    expect(() =>
      creatorTranslationSchema.parse({
        titleId: "987f6543-e21b-43d2-a456-426614174000",
        locale: "fr",
        name: "Jardin",
        synopsis: "Histoire",
      }),
    ).toThrow();
  });
});
