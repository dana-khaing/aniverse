"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { localePath, messages, type Locale } from "@/lib/i18n";
import {
  Brand,
  HeaderActions,
  MobileDock,
  MoreMenu,
} from "@/components/catalog/site-navigation";
import { LocaleSwitcher } from "@/components/catalog/locale-switcher";
import { HeaderSearch } from "@/components/catalog/header-search";

export function PublicHeader({
  locale = "en",
  path = "/",
}: {
  locale?: Locale;
  path?: string;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const searchTrigger = useRef<HTMLElement | null>(null);
  const openSearch = (trigger?: HTMLElement) => {
    if (trigger) searchTrigger.current = trigger;
    setSearchOpen(true);
  };
  const closeSearch = () => {
    setSearchOpen(false);
    window.requestAnimationFrame(() => searchTrigger.current?.focus());
  };
  const copy = messages[locale];
  return (
    <>
      <header className="catalog-header">
        <Brand href={localePath(locale)} />
        <nav className="catalog-primary-nav" aria-label="Primary navigation">
          <Link href={localePath(locale)}>{copy.nav.home}</Link>
          <Link href={localePath(locale, "/browse")}>{copy.nav.browse}</Link>
          <Link href={localePath(locale, "/schedule")}>
            {copy.nav.schedule}
          </Link>
          <Link className="nav-wide" href={localePath(locale,"/charts/seasonal")}>{copy.nav.charts}</Link>
          <Link className="nav-wide" href={localePath(locale,"/community")}>{copy.nav.community}</Link>
          <Link className="nav-wide" href={localePath(locale,"/creators")}>{copy.nav.creators}</Link>
          <MoreMenu locale={locale}/>
        </nav>
        <LocaleSwitcher locale={locale} path={path} />
        <HeaderSearch locale={locale} open={searchOpen} onOpen={openSearch} onClose={closeSearch} />
        <HeaderActions compact showSearch={false} locale={locale} />
      </header>
      <MobileDock locale={locale} onSearch={openSearch} />
    </>
  );
}
