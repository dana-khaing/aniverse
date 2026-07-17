import "server-only";

import {
  catalog,
  getTitle as getFixtureTitle,
  searchCatalog as searchFixtureCatalog,
  filterCatalog,
  type SearchFilters,
  type CatalogTitle,
} from "@/lib/catalog";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type CatalogRow = {
  id: string;
  creator_team_id: string | null;
  slug: string;
  name: string;
  native_name: string | null;
  synopsis: string;
  format: "series" | "movie" | "ova" | "ona" | "special";
  release_year: number | null;
  average_score: number | string;
  poster_tone: string;
  status: string;
  studios: { name: string } | null;
  title_genres: Array<{ genres: { name: string } | null }>;
  seasons: Array<{ episodes: Array<{ number: number | string }> }>;
};

function mapTitle(row: CatalogRow): CatalogTitle {
  const episodeNumbers = row.seasons.flatMap((season) => season.episodes);

  return {
    id: row.id,
    creatorTeamId: row.creator_team_id ?? undefined,
    slug: row.slug,
    name: row.name,
    nativeName: row.native_name ?? row.name,
    synopsis: row.synopsis,
    genre: row.title_genres.flatMap(({ genres }) =>
      genres ? [genres.name] : [],
    ),
    year: row.release_year ?? new Date().getUTCFullYear(),
    score: Number(row.average_score),
    episodes: episodeNumbers.length,
    format: row.format === "movie" ? "Movie" : "TV",
    tone: row.poster_tone,
    studio: row.studios?.name ?? "Independent",
    status: row.status === "published" ? "Airing" : row.status,
  };
}

async function queryCatalog() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("titles")
    .select(
      "id,creator_team_id,slug,name,native_name,synopsis,format,release_year,average_score,poster_tone,status,studios(name),title_genres(genres(name)),seasons(episodes(number))",
    )
    .eq("status", "published")
    .order("popularity_score", { ascending: false });

  if (error) throw new Error(`Unable to load the catalog: ${error.message}`);

  return (data as unknown as CatalogRow[]).map(mapTitle);
}

export async function listCatalog(): Promise<CatalogTitle[]> {
  return isSupabaseConfigured() ? queryCatalog() : catalog;
}

export async function searchCatalog(
  query = "",
  genre = "all",
): Promise<CatalogTitle[]> {
  if (!isSupabaseConfigured()) return searchFixtureCatalog(query, genre);

  const normalizedQuery = query.trim().toLowerCase();
  const normalizedGenre = genre.toLowerCase();
  const titles = await queryCatalog();

  return titles.filter(
    (title) =>
      (!normalizedQuery ||
        `${title.name} ${title.nativeName} ${title.synopsis} ${title.genre.join(" ")}`
          .toLowerCase()
          .includes(normalizedQuery)) &&
      (genre === "all" ||
        title.genre.some((name) => name.toLowerCase() === normalizedGenre)),
  );
}

export async function filterCatalogRepository(filters: SearchFilters) {
  return filterCatalog(await listCatalog(), filters);
}

export async function getTitle(slug: string): Promise<CatalogTitle | undefined> {
  if (!isSupabaseConfigured()) return getFixtureTitle(slug);
  return (await queryCatalog()).find((title) => title.slug === slug);
}
