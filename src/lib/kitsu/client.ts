import "server-only";

import { z } from "zod";

const KITSU_ENDPOINT = "https://kitsu.io/api/edge/anime";

const imageSchema = z
  .object({
    tiny: z.string().url().nullish(),
    small: z.string().url().nullish(),
    medium: z.string().url().nullish(),
    large: z.string().url().nullish(),
    original: z.string().url().nullish(),
  })
  .nullish();

const animeSchema = z.object({
  id: z.string(),
  type: z.literal("anime"),
  attributes: z.object({
    slug: z.string(),
    canonicalTitle: z.string(),
    titles: z.record(z.string(), z.string().nullish()),
    synopsis: z.string().nullish(),
    description: z.string().nullish(),
    subtype: z.string().nullish(),
    status: z.string().nullish(),
    startDate: z.string().nullish(),
    endDate: z.string().nullish(),
    episodeCount: z.number().int().nonnegative().nullish(),
    ageRating: z.string().nullish(),
    ageRatingGuide: z.string().nullish(),
    posterImage: imageSchema,
    coverImage: imageSchema,
  }),
});

const collectionSchema = z.object({ data: z.array(animeSchema) });
const resourceSchema = z.object({ data: animeSchema });

export type KitsuTitle = {
  id: string;
  slug: string;
  title: string;
  nativeTitle: string;
  synopsis: string;
  subtype: string | null;
  status: string | null;
  startDate: string | null;
  endDate: string | null;
  episodeCount: number | null;
  ageRating: string | null;
  ageRatingGuide: string | null;
  posterImage: string | null;
  coverImage: string | null;
  siteUrl: string;
};

function preferredImage(image: z.infer<typeof imageSchema>) {
  return image?.large ?? image?.medium ?? image?.small ?? image?.original ?? null;
}

function mapAnime({ id, attributes }: z.infer<typeof animeSchema>): KitsuTitle {
  return {
    id,
    slug: attributes.slug,
    title:
      attributes.titles.en ??
      attributes.titles.en_jp ??
      attributes.canonicalTitle,
    nativeTitle:
      attributes.titles.ja_jp ??
      attributes.titles.en_jp ??
      attributes.canonicalTitle,
    synopsis: attributes.synopsis ?? attributes.description ?? "",
    subtype: attributes.subtype ?? null,
    status: attributes.status ?? null,
    startDate: attributes.startDate ?? null,
    endDate: attributes.endDate ?? null,
    episodeCount: attributes.episodeCount ?? null,
    ageRating: attributes.ageRating ?? null,
    ageRatingGuide: attributes.ageRatingGuide ?? null,
    posterImage: preferredImage(attributes.posterImage),
    coverImage: preferredImage(attributes.coverImage),
    siteUrl: `https://kitsu.app/anime/${attributes.slug}`,
  };
}

async function requestKitsu(url: URL) {
  const response = await fetch(url, {
    headers: {
      accept: "application/vnd.api+json",
      "user-agent": "AniVerse/0.1 (+https://github.com/dana-khaing/aniverse)",
    },
    signal: AbortSignal.timeout(4_000),
    next: { revalidate: 900 },
  });
  if (!response.ok)
    throw new Error(`Kitsu request failed with status ${response.status}`);
  return response.json() as Promise<unknown>;
}

export async function searchKitsu(term: string, limit = 6) {
  const query = term.trim();
  if (query.length < 2) return [];
  const url = new URL(KITSU_ENDPOINT);
  url.searchParams.set("filter[text]", query.slice(0, 80));
  url.searchParams.set("page[limit]", String(Math.min(Math.max(limit, 1), 10)));
  const payload = collectionSchema.parse(await requestKitsu(url));
  return payload.data.map(mapAnime);
}

export async function getKitsuTitle(id: string) {
  if (!/^\d+$/.test(id)) return null;
  const payload = resourceSchema.parse(
    await requestKitsu(new URL(`${KITSU_ENDPOINT}/${id}`)),
  );
  return mapAnime(payload.data);
}
