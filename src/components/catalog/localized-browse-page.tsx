import { Filter, RotateCcw } from "lucide-react";
import Link from "next/link";
import { PublicHeader } from "@/components/catalog/public-header";
import { SearchAutocomplete } from "@/components/catalog/search-autocomplete";
import { TitleCard } from "@/components/catalog/title-card";
import { filterCatalogRepository, listCatalog } from "@/lib/catalog-repository";
import type { CatalogTitle } from "@/lib/catalog";
import { localePath, localizeGenre, messages, type Locale } from "@/lib/i18n";

export type BrowseParams = {
  q?: string;
  genre?: string;
  year?: string;
  format?: CatalogTitle["format"] | "all";
  status?: string;
  studio?: string;
  score?: string;
  sort?: "popular" | "score" | "newest" | "title";
};

const genres = [
  "Fantasy",
  "Action",
  "Drama",
  "Romance",
  "Sci-fi",
  "Mystery",
  "Supernatural",
  "Adventure",
] as const;

export async function LocalizedBrowsePage({
  locale,
  searchParams,
}: {
  locale: Locale;
  searchParams: Promise<BrowseParams>;
}) {
  const params = await searchParams;
  const copy = messages[locale].browse;
  const [all, results] = await Promise.all([
    listCatalog(),
    filterCatalogRepository({
      query: params.q,
      genre: params.genre,
      year: params.year ? Number(params.year) : undefined,
      format: params.format,
      status: params.status,
      studio: params.studio,
      minScore: params.score ? Number(params.score) : undefined,
      sort: params.sort,
    }),
  ]);
  const studios = [...new Set(all.map((title) => title.studio))].sort();
  const years = [...new Set(all.map((title) => title.year))].sort(
    (a, b) => b - a,
  );
  return (
    <>
      <PublicHeader locale={locale} path="/browse" />
      <main className="catalog-page">
        <div className="catalog-title">
          <p>{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <span>{copy.copy}</span>
        </div>
        <form className="browse-tools advanced">
          <SearchAutocomplete
            defaultValue={params.q}
            placeholder={messages[locale].home.searchPlaceholder}
          />
          <select
            name="genre"
            defaultValue={params.genre ?? "all"}
            aria-label={copy.genre}
          >
            <option value="all">{copy.allGenres}</option>
            {genres.map((genre) => (
              <option key={genre} value={genre}>
                {localizeGenre(locale, genre)}
              </option>
            ))}
          </select>
          <select
            name="year"
            defaultValue={params.year ?? ""}
            aria-label={copy.year}
          >
            <option value="">{copy.anyYear}</option>
            {years.map((year) => (
              <option key={year}>{year}</option>
            ))}
          </select>
          <select
            name="format"
            defaultValue={params.format ?? "all"}
            aria-label={copy.format}
          >
            <option value="all">{copy.allFormats}</option>
            <option>TV</option>
            <option>Movie</option>
          </select>
          <select
            name="status"
            defaultValue={params.status ?? "all"}
            aria-label={copy.status}
          >
            <option value="all">{copy.anyStatus}</option>
            <option value="Airing">
              {locale === "ja" ? "配信中" : "Airing"}
            </option>
            <option value="Finished">
              {locale === "ja" ? "完結" : "Finished"}
            </option>
          </select>
          <select
            name="studio"
            defaultValue={params.studio ?? "all"}
            aria-label={copy.studio}
          >
            <option value="all">{copy.allStudios}</option>
            {studios.map((studio) => (
              <option key={studio}>{studio}</option>
            ))}
          </select>
          <select
            name="score"
            defaultValue={params.score ?? ""}
            aria-label={copy.minimumScore}
          >
            <option value="">{copy.anyScore}</option>
            <option value="8.5">8.5+</option>
            <option value="9">9.0+</option>
          </select>
          <select
            name="sort"
            defaultValue={params.sort ?? "score"}
            aria-label={copy.sort}
          >
            <option value="score">{copy.topRated}</option>
            <option value="newest">{copy.newest}</option>
            <option value="title">{copy.alphabetical}</option>
          </select>
          <button>
            <Filter size={16} />
            {copy.apply}
          </button>
          <Link
            className="reset-filter"
            href={localePath(locale, "/browse")}
            aria-label={copy.reset}
          >
            <RotateCcw size={16} />
          </Link>
        </form>
        <div className="result-head">
          <span>
            {new Intl.NumberFormat(locale).format(results.length)} {copy.titles}
          </span>
          <span>{copy.filtered}</span>
        </div>
        <section className="catalog-grid">
          {results.map((title) => (
            <TitleCard key={title.slug} title={title} />
          ))}
        </section>
        {results.length === 0 && (
          <div className="empty-catalog">
            <h2>{copy.emptyTitle}</h2>
            <p>{copy.emptyCopy}</p>
          </div>
        )}
      </main>
    </>
  );
}
