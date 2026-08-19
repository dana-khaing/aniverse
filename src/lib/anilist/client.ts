import "server-only";

import { z } from "zod";

const ANILIST_ENDPOINT = "https://graphql.anilist.co";

const mediaSchema = z.object({
  id: z.number(),
  title: z.object({
    romaji: z.string().nullable(),
    english: z.string().nullable(),
    native: z.string().nullable(),
  }),
  description: z.string().nullable(),
  averageScore: z.number().nullable(),
  genres: z.array(z.string()),
  format: z.string().nullable(),
  status: z.string().nullable(),
  seasonYear: z.number().nullable(),
  episodes: z.number().nullable(),
  coverImage: z.object({
    large: z.string().nullable(),
    color: z.string().nullable(),
  }),
  siteUrl: z.string(),
});

const pageSchema = z.object({
  Page: z.object({ media: z.array(mediaSchema) }),
});

export type AniListTitle = {
  id: number;
  title: string;
  nativeTitle: string;
  synopsis: string;
  score: number | null;
  genres: string[];
  format: string | null;
  status: string | null;
  year: number | null;
  episodes: number | null;
  coverImage: string | null;
  accentColor: string | null;
  siteUrl: string;
};

function mapMedia(media: z.infer<typeof mediaSchema>): AniListTitle {
  return {
    id: media.id,
    title: media.title.english ?? media.title.romaji ?? media.title.native ?? "Untitled",
    nativeTitle: media.title.native ?? media.title.romaji ?? "",
    synopsis: (media.description ?? "").replace(/<[^>]+>/g, "").trim(),
    score: media.averageScore,
    genres: media.genres,
    format: media.format,
    status: media.status,
    year: media.seasonYear,
    episodes: media.episodes,
    coverImage: media.coverImage.large,
    accentColor: media.coverImage.color,
    siteUrl: media.siteUrl,
  };
}

const MEDIA_FIELDS = `id title{romaji english native} description(asHtml:false) averageScore genres format status seasonYear episodes coverImage{large color} siteUrl`;

const TRENDING_QUERY = `query($perPage:Int){Page(perPage:$perPage){media(sort:TRENDING_DESC,type:ANIME){${MEDIA_FIELDS}}}}`;

const SEARCH_QUERY = `query($search:String,$perPage:Int){Page(perPage:$perPage){media(search:$search,type:ANIME,sort:SEARCH_MATCH){${MEDIA_FIELDS}}}}`;

async function queryAniList(document: string, variables: Record<string, unknown>) {
  const response = await fetch(ANILIST_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ query: document, variables }),
    next: { revalidate: 900 },
  });
  if (!response.ok) throw new Error(`AniList request failed with status ${response.status}`);
  const payload: unknown = await response.json();
  if (
    payload &&
    typeof payload === "object" &&
    "errors" in payload &&
    Array.isArray((payload as { errors?: unknown }).errors) &&
    (payload as { errors: unknown[] }).errors.length > 0
  ) {
    const [firstError] = (payload as { errors: Array<{ message?: string }> }).errors;
    throw new Error(firstError?.message ?? "AniList query failed");
  }
  const { Page } = pageSchema.parse((payload as { data: unknown }).data);
  return Page.media.map(mapMedia);
}

export async function getAniListTrending(limit = 8): Promise<AniListTitle[]> {
  return queryAniList(TRENDING_QUERY, { perPage: limit });
}

export async function searchAniList(term: string, limit = 6): Promise<AniListTitle[]> {
  const trimmed = term.trim();
  if (trimmed.length < 2) return [];
  return queryAniList(SEARCH_QUERY, { search: trimmed, perPage: limit });
}
