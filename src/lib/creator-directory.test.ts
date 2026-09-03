import { describe, expect, it } from "vitest";
import { catalog } from "@/lib/catalog";
import { buildCreatorDirectory } from "@/lib/creator-directory";

describe("buildCreatorDirectory", () => {
  it("groups titles by studio and calculates creator metadata", () => {
    const creators = buildCreatorDirectory([
      catalog[0],
      { ...catalog[1], studio: catalog[0].studio },
    ]);

    expect(creators).toHaveLength(1);
    expect(creators[0]).toMatchObject({
      name: "Lumen Works",
      slug: "Lumen%20Works",
      titleCount: 2,
      averageScore: 9.1,
    });
    expect(creators[0].genres).toContain("Fantasy");
  });

  it("returns an empty directory when there are no published titles", () => {
    expect(buildCreatorDirectory([])).toEqual([]);
  });
});
