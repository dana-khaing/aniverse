import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocalizedSchedulePage } from "@/components/catalog/localized-schedule-page";
import { isLocale, messages } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const copy = messages[locale].schedule;
  return {
    title: copy.title,
    description: copy.copy,
    alternates: {
      languages: { en: "/en/schedule", ja: "/ja/schedule" },
    },
  };
}

export default async function LocaleSchedule({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <LocalizedSchedulePage locale={locale} />;
}
