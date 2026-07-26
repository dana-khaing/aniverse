import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  LocalizedBrowsePage,
  type BrowseParams,
} from "@/components/catalog/localized-browse-page";
import { isLocale, messages } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const copy = messages[locale].browse;
  return {
    title: copy.title,
    description: copy.copy,
    alternates: {
      languages: { en: "/en/browse", ja: "/ja/browse" },
    },
  };
}

export default async function LocaleBrowse({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<BrowseParams>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <LocalizedBrowsePage locale={locale} searchParams={searchParams} />;
}
