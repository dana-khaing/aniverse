import type { CatalogTitle } from "@/lib/catalog";

export type CreatorProfile = {
  name: string;
  slug: string;
  titleCount: number;
  averageScore: number;
  genres: string[];
  tone: string;
};

export function buildCreatorDirectory(titles: CatalogTitle[]): CreatorProfile[] {
  const studios = new Map<string, CatalogTitle[]>();

  for (const title of titles) {
    studios.set(title.studio, [...(studios.get(title.studio) ?? []), title]);
  }

  return [...studios.entries()]
    .map(([name, studioTitles]) => ({
      name,
      slug: encodeURIComponent(name),
      titleCount: studioTitles.length,
      averageScore:
        Math.round(
          (studioTitles.reduce((sum, title) => sum + title.score, 0) /
            studioTitles.length) *
            10,
        ) / 10,
      genres: [...new Set(studioTitles.flatMap((title) => title.genre))].slice(0, 3),
      tone: studioTitles[0].tone,
    }))
    .toSorted((a, b) => b.averageScore - a.averageScore || a.name.localeCompare(b.name));
}
