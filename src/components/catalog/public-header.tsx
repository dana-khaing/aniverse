import Link from "next/link";
import { localePath, messages, type Locale } from "@/lib/i18n";
import {
  Brand,
  HeaderActions,
  MobileDock,
} from "@/components/catalog/site-navigation";

export function PublicHeader({ locale = "en" }: { locale?: Locale }) {
  const copy = messages[locale];
  return (
    <>
      <header className="catalog-header">
        <Brand href={localePath(locale)} />
        <nav aria-label="Primary navigation">
          <Link href={localePath(locale)}>{copy.nav.home}</Link>
          <Link href={localePath(locale, "/browse")}>{copy.nav.browse}</Link>
          <Link href={localePath(locale, "/schedule")}>
            {copy.nav.schedule}
          </Link>
          <Link href="/charts/seasonal">{copy.nav.charts}</Link>
          <Link href="/community">{copy.nav.community}</Link>
        </nav>
        <HeaderActions compact locale={locale} />
      </header>
      <MobileDock locale={locale} />
    </>
  );
}
