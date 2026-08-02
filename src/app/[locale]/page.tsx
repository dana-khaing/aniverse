import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicHeader } from "@/components/catalog/public-header";
import { TitleCard } from "@/components/catalog/title-card";
import { listCatalog } from "@/lib/catalog-repository";
import { isLocale, localePath, locales, messages } from "@/lib/i18n";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const copy = messages[locale].home;
  return {
    title: copy.title,
    description: copy.copy,
    alternates: {
      canonical: localePath(locale),
      languages: { en: "/en", ja: "/ja" },
    },
  };
}

export default async function LocaleHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const copy = messages[locale];
  const catalog = await listCatalog();
  return (
    <>
      <PublicHeader locale={locale} />
      <main className="locale-home" lang={locale}>
        <section className="locale-hero">
          <p>{copy.home.eyebrow}</p>
          <h1>{copy.home.title}</h1>
          <span>{copy.home.copy}</span>
          <Link href={localePath(locale, "/browse")}>{copy.home.cta}</Link>
        </section>
        <section className="locale-featured content-section">
          <div className="section-heading">
            <div>
              <div>
                <p>{copy.home.watchingEyebrow}</p>
                <h2>{copy.home.trendingNow}</h2>
              </div>
            </div>
            <Link href={localePath(locale, "/browse")}>
              {copy.home.viewAll}
            </Link>
          </div>
          <div className="catalog-grid">
            {catalog.slice(0, 5).map((title) => (
              <TitleCard
                key={title.slug}
                title={{
                  ...title,
                  name: locale === "ja" ? title.nativeName : title.name,
                }}
              />
            ))}
          </div>
        </section>
      </main>
      <footer lang={locale}>
        <p>{copy.footer.tagline}</p>
        <div>
          <Link href={localePath(locale,"about")}>{copy.footer.about}</Link>
          <Link href="/guide">Guide</Link>
          <Link href={localePath(locale,"terms")}>{copy.footer.terms}</Link>
          <Link href={localePath(locale,"privacy")}>{copy.footer.privacy}</Link>
          <Link href={localePath(locale,"takedown")}>{copy.footer.takedown}</Link>
        </div>
        <span>© 2026 AniVerse</span>
      </footer>
    </>
  );
}
