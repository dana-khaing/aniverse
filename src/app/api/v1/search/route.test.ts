import { beforeEach, describe, expect, it, vi } from "vitest";

const { searchCatalog, searchKitsu } = vi.hoisted(() => ({
  searchCatalog: vi.fn(),
  searchKitsu: vi.fn(),
}));

vi.mock("@/lib/catalog-repository", () => ({ searchCatalog }));
vi.mock("@/lib/kitsu/client", () => ({ searchKitsu }));
vi.mock("@/lib/distributed-security", () => ({
  consumeDistributedRateLimit: vi.fn().mockResolvedValue(true),
}));

import { GET, omitLocalMatches } from "./route";

const local = {
  slug: "neon-ronin",
  name: "Neon Ronin",
  nativeName: "ネオン浪人",
  genre: ["Action"],
  year: 2026,
  studio: "Voltage Frame",
  tone: "cyan",
};
const discovery = {
  id: "12",
  slug: "neon-ronin",
  title: "Neon Ronin",
  nativeTitle: "ネオン浪人",
  synopsis: "",
  subtype: "TV",
  status: "current",
  startDate: null,
  endDate: null,
  episodeCount: 12,
  ageRating: null,
  ageRatingGuide: null,
  posterImage: null,
  coverImage: null,
  siteUrl: "https://kitsu.app/anime/neon-ronin",
};

describe("mixed catalog search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchCatalog.mockResolvedValue([local]);
    searchKitsu.mockResolvedValue([
      { ...discovery, id: "13", title: "Neon City", nativeTitle: "ネオンシティ" },
    ]);
  });

  it("keeps the legacy local data field and adds discovery results", async () => {
    const response = await GET(new Request("http://localhost/api/v1/search?q=neon"));
    const payload = await response.json();
    expect(payload.data).toEqual([expect.objectContaining({ slug: "neon-ronin" })]);
    expect(payload.discovery).toEqual([expect.objectContaining({ id: "13" })]);
    expect(payload.meta).toEqual({ query: "neon", discoveryAvailable: true });
  });

  it("returns local results when Kitsu is unavailable", async () => {
    searchKitsu.mockRejectedValue(new Error("timeout"));
    const response = await GET(new Request("http://localhost/api/v1/search?q=neon"));
    await expect(response.json()).resolves.toMatchObject({
      data: [expect.objectContaining({ slug: "neon-ronin" })],
      discovery: [],
      meta: { discoveryAvailable: false },
    });
  });

  it("removes discovery duplicates by localized title", () => {
    expect(omitLocalMatches([discovery], [local])).toEqual([]);
  });
});
