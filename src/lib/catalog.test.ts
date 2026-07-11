import { describe, expect, it } from "vitest";
import { catalog, getTitle, searchCatalog } from "./catalog";

describe("catalog discovery", () => {
  it("filters titles by query and genre", () => {
    expect(searchCatalog("stars").map((title) => title.slug)).toContain("echoes-of-asteria");
    expect(searchCatalog("", "Fantasy")).toHaveLength(3);
    expect(searchCatalog("neon", "Drama")).toEqual([]);
  });

  it("resolves stable public title slugs", () => {
    expect(getTitle("paper-moons")?.name).toBe("Paper Moons");
    expect(getTitle("missing-title")).toBeUndefined();
    expect(new Set(catalog.map((title) => title.slug)).size).toBe(catalog.length);
  });
});
