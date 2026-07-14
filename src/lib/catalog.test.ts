import { describe, expect, it } from "vitest";
import { catalog, filterCatalog, getTitle, recommendCatalog, searchCatalog, suggestCatalog } from "./catalog";

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

it("combines advanced filters and sorting",()=>{expect(filterCatalog(catalog,{genre:"Fantasy",year:2025,minScore:8.9,sort:"title"}).map((title)=>title.slug)).toEqual(["skybound"]);});
it("suggests studios and translated titles",()=>{expect(suggestCatalog(catalog,"lumen")[0]?.slug).toBe("echoes-of-asteria");expect(suggestCatalog(catalog,"アステリア")[0]?.slug).toBe("echoes-of-asteria");});
it("explains personalized recommendations",()=>{const recommendations=recommendCatalog(catalog,["echoes-of-asteria"]);expect(recommendations[0].reason).toMatch(/Because you watched/);expect(recommendations.every(({title})=>title.slug!=="echoes-of-asteria")).toBe(true);});
