import { describe, expect, it } from "vitest";
import manifest from "./manifest";

describe("AniVerse web manifest", () => {
  it("publishes regular and maskable orbit icons", () => {
    expect(manifest().icons).toEqual([
      { src:"/icons/aniverse-192.png",sizes:"192x192",type:"image/png" },
      { src:"/icons/aniverse-512.png",sizes:"512x512",type:"image/png" },
      { src:"/icons/aniverse-maskable-512.png",sizes:"512x512",type:"image/png",purpose:"maskable" },
    ]);
  });
});
