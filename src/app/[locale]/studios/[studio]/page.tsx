import { notFound } from "next/navigation";
import { StudioProfilePage } from "@/components/catalog/studio-profile-page";
import { isLocale } from "@/lib/i18n";

export default async function LocalizedStudioPage({ params }: { params: Promise<{ locale: string; studio: string }> }) {
  const { locale, studio } = await params;
  if (!isLocale(locale)) notFound();
  return <StudioProfilePage locale={locale} studio={studio} />;
}
