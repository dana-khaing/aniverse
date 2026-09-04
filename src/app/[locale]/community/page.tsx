import { notFound } from "next/navigation";
import { PublicHeader } from "@/components/catalog/public-header";
import { CommunityFeed } from "@/components/community/community-feed";
import { isLocale } from "@/lib/i18n";

export default async function LocalizedCommunity({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <>
      <PublicHeader locale={locale} path="/community" />
      <CommunityFeed locale={locale} />
    </>
  );
}
