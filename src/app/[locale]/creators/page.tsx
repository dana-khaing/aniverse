import Link from "next/link";
import { ArrowRight, Clapperboard, Star } from "lucide-react";
import { notFound } from "next/navigation";
import { PublicHeader } from "@/components/catalog/public-header";
import { listCatalog } from "@/lib/catalog-repository";
import { buildCreatorDirectory } from "@/lib/creator-directory";
import { isLocale, localePath } from "@/lib/i18n";

const copy = {
  en: { eyebrow: "INDEPENDENT VOICES", title: "Explore creators", intro: "Meet the studios building AniVerse's original worlds.", works: "titles", apply: "Publish your work", empty: "Creator profiles are coming soon." },
  ja: { eyebrow: "独立した才能", title: "クリエイターを探す", intro: "AniVerseの物語を生み出すスタジオに出会いましょう。", works: "作品", apply: "作品を公開する", empty: "クリエイタープロフィールは近日公開予定です。" },
} as const;

export default async function CreatorsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const creators = buildCreatorDirectory(await listCatalog());
  const labels = copy[locale];

  return <>
    <PublicHeader locale={locale} path="/creators" />
    <main className="catalog-page creator-directory" lang={locale}>
      <header className="creator-directory-head">
        <div className="catalog-title"><p>{labels.eyebrow}</p><h1>{labels.title}</h1><span>{labels.intro}</span></div>
        <Link href="/creator/apply">{labels.apply}<ArrowRight size={15} /></Link>
      </header>
      {creators.length ? <section className="creator-grid">{creators.map((creator) =>
        <Link className="creator-card" href={localePath(locale, `/studios/${creator.slug}`)} key={creator.name}>
          <div className={`creator-mark poster-${creator.tone}`}><Clapperboard /><span>{creator.name.slice(0, 2).toUpperCase()}</span></div>
          <div><h2>{creator.name}</h2><p>{creator.genres.join(" · ")}</p></div>
          <footer><span>{creator.titleCount} {labels.works}</span><b><Star size={12} fill="currentColor" /> {creator.averageScore}</b></footer>
        </Link>)}</section> : <p className="creator-empty">{labels.empty}</p>}
    </main>
  </>;
}
