import { notFound } from "next/navigation";
import { PublicHeader } from "@/components/catalog/public-header";
import { TitleCard } from "@/components/catalog/title-card";
import { listCatalog } from "@/lib/catalog-repository";
import type { Locale } from "@/lib/i18n";

const copy = {
  en: { eyebrow: "CREATOR SPOTLIGHT", suffix: "creator-owned title", suffixPlural: "creator-owned titles" },
  ja: { eyebrow: "クリエイター特集", suffix: "本のクリエイター作品", suffixPlural: "本のクリエイター作品" },
} as const;

export async function StudioProfilePage({ studio, locale }: { studio: string; locale: Locale }) {
  const name = decodeURIComponent(studio);
  const titles = (await listCatalog()).filter(
    (title) => title.studio.toLowerCase() === name.toLowerCase(),
  );
  if (!titles.length) notFound();
  const labels = copy[locale];

  return (
    <>
      <PublicHeader locale={locale} path={`/studios/${studio}`} />
      <main className="catalog-page" lang={locale}>
        <div className="catalog-title">
          <p>{labels.eyebrow}</p>
          <h1>{titles[0].studio}</h1>
          <span>
            {titles.length} {titles.length === 1 ? labels.suffix : labels.suffixPlural} {locale === "en" ? "on AniVerse." : "をAniVerseで配信中。"}
          </span>
        </div>
        <section className="catalog-grid studio-grid">
          {titles.map((title) => <TitleCard key={title.slug} title={title} />)}
        </section>
      </main>
    </>
  );
}
