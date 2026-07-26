import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicHeader } from "@/components/catalog/public-header";
import { isLocale, localePath, locales, messages } from "@/lib/i18n";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const copy = messages[locale];
  return (
    <>
      <PublicHeader locale={locale} />
      <main className="locale-home">
        <p>{copy.home.eyebrow}</p>
        <h1>{copy.home.title}</h1>
        <span>{copy.home.copy}</span>
        <Link href={localePath(locale, "/browse")}>{copy.home.cta}</Link>
        <nav aria-label={copy.language}>
          <Link href="/en" hrefLang="en">
            English
          </Link>
          <Link href="/ja" hrefLang="ja" lang="ja">
            日本語
          </Link>
        </nav>
      </main>
    </>
  );
}
