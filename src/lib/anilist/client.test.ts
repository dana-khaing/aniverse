import { afterEach, describe, expect, it, vi } from "vitest";
import { getAniListTrending, searchAniList } from "./client";

function mockMedia(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 1,
    title: { romaji: "Neon Ronin", english: null, native: "ネオン浪人" },
    description: "<p>A masterless swordsman <b>hunts</b> corrupted memories.</p>",
    averageScore: 89,
    genres: ["Action", "Sci-Fi"],
    format: "TV",
    status: "RELEASING",
    seasonYear: 2026,
    episodes: 12,
    coverImage: { large: "https://example.com/cover.jpg", color: "#5fc4ff" },
    siteUrl: "https://anilist.co/anime/1",
    ...overrides,
  };
}

describe("AniList client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps trending AniList media into the AniVerse shape and strips HTML from the synopsis", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ data: { Page: { media: [mockMedia()] } } }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const results = await getAniListTrending(8);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://graphql.anilist.co",
      expect.objectContaining({ method: "POST" }),
    );
    expect(results).toEqual([
      expect.objectContaining({
        id: 1,
        title: "Neon Ronin",
        nativeTitle: "ネオン浪人",
        synopsis: "A masterless swordsman hunts corrupted memories.",
        score: 89,
        genres: ["Action", "Sci-Fi"],
        year: 2026,
        coverImage: "https://example.com/cover.jpg",
        siteUrl: "https://anilist.co/anime/1",
      }),
    ]);
  });

  it("returns an empty list for a too-short search term without calling AniList", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const results = await searchAniList("a");

    expect(results).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws when AniList responds with a GraphQL error", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ errors: [{ message: "Too many requests." }] })),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(searchAniList("neon ronin")).rejects.toThrow("Too many requests.");
  });

  it("throws when the AniList request fails at the transport level", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(searchAniList("neon ronin")).rejects.toThrow("status 500");
  });
});
