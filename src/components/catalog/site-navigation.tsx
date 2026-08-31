import Link from "next/link";
import {
  Bell,
  CalendarDays,
  Compass,
  Home,
  Library,
  Search,
  UserRound,
} from "lucide-react";
import { localePath, messages, type Locale } from "@/lib/i18n";

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link className="brand" href={href} aria-label="AniVerse home">
      <span className="brand-orbit">
        <span />
      </span>
      <span>
        Ani<span>Verse</span>
      </span>
    </Link>
  );
}

export function MobileDock({ locale = "en", onSearch }: { locale?: Locale; onSearch?: (trigger:HTMLButtonElement) => void }) {
  const copy = messages[locale].nav;
  return (
    <nav className="mobile-dock" aria-label="Mobile navigation">
      <Link href={localePath(locale)}>
        <Home size={19} />
        <span>{copy.home}</span>
      </Link>
      <Link href={localePath(locale, "/browse")}>
        <Compass size={19} />
        <span>{copy.browse}</span>
      </Link>
      {onSearch ? <button className="dock-search" aria-label={copy.search} onClick={event=>onSearch(event.currentTarget)}><Search size={22} /></button> : <Link className="dock-search" href={localePath(locale, "/browse")} aria-label={copy.search}><Search size={22} /></Link>}
      <Link href={localePath(locale, "/schedule")}>
        <CalendarDays size={19} />
        <span>{copy.schedule}</span>
      </Link>
      <Link href="/library">
        <Library size={19} />
        <span>{copy.library}</span>
      </Link>
    </nav>
  );
}

export function HeaderActions({
  compact = false,
  locale = "en",
}: {
  compact?: boolean;
  locale?: Locale;
}) {
  const copy = messages[locale].nav;
  return (
    <div className="header-actions">
      <Link
        className="icon-button"
        aria-label={copy.search}
        href={localePath(locale, "/browse")}
      >
        <Search size={18} />
      </Link>
      {!compact && (
        <Link
          className="icon-button hide-mobile"
          aria-label={copy.notifications}
          href="/account"
        >
          <Bell size={18} />
          <i />
        </Link>
      )}
      <Link
        className="profile-button"
        aria-label={copy.account}
        href="/account"
      >
        <UserRound size={17} />
        <span>{copy.mySpace}</span>
      </Link>
    </div>
  );
}
