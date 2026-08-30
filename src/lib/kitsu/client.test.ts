import { afterEach, describe, expect, it, vi } from "vitest";
import { getKitsuTitle, searchKitsu } from "./client";

function anime() {
  return {
    id: "1555",
    type: "anime",
    attributes: {
      slug: "naruto-shippuden",
      canonicalTitle: "Naruto Shippuden",
      titles: { en: "Naruto Shippuden", en_jp: "Naruto: Shippuden", ja_jp: "ナルト 疾風伝" },
      synopsis: "A returning ninja protects his village.",
      description: "",
      subtype: "TV",
      status: "finished",
      startDate: "2007-02-15",
      endDate: "2017-03-23",
      episodeCount: 500,
      ageRating: "PG",
      ageRatingGuide: "Teens 13 or older",
      posterImage: { large: "https://media.kitsu.app/anime/poster_images/1555/large.jpg" },
      coverImage: null,
    },
  };
}

describe("Kitsu client", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("maps search results into safe AniVerse discovery metadata", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({ data: [anime()] }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(searchKitsu("naruto", 4)).resolves.toEqual([
      expect.objectContaining({
        id: "1555",
        title: "Naruto Shippuden",
        nativeTitle: "ナルト 疾風伝",
        episodeCount: 500,
        siteUrl: "https://kitsu.app/anime/naruto-shippuden",
      }),
    ]);
    expect(String(fetchMock.mock.calls[0][0])).toContain("filter%5Btext%5D=naruto");
  });

  it("does not call Kitsu for short searches or invalid ids", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(searchKitsu("n")).resolves.toEqual([]);
    await expect(getKitsuTitle("not-an-id")).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("surfaces provider and schema failures to the caller", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 503 })),
    );
    await expect(searchKitsu("naruto")).rejects.toThrow("status 503");
  });
});
