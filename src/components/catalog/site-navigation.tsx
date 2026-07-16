import Link from "next/link";
import { Bell, CalendarDays, Compass, Home, Library, Search, UserRound } from "lucide-react";

export function Brand({ href = "/" }: { href?: string }) {
  return <Link className="brand" href={href} aria-label="AniVerse home"><span className="brand-orbit"><span /></span><span>Ani<span>Verse</span></span></Link>;
}

export function MobileDock() {
  return <nav className="mobile-dock" aria-label="Mobile navigation">
    <Link href="/"><Home size={19}/><span>Home</span></Link>
    <Link href="/browse"><Compass size={19}/><span>Browse</span></Link>
    <Link className="dock-search" href="/browse" aria-label="Search anime"><Search size={22}/></Link>
    <Link href="/schedule"><CalendarDays size={19}/><span>Schedule</span></Link>
    <Link href="/library"><Library size={19}/><span>Library</span></Link>
  </nav>;
}

export function HeaderActions({ compact = false }: { compact?: boolean }) {
  return <div className="header-actions">
    <Link className="icon-button" aria-label="Search" href="/browse"><Search size={18}/></Link>
    {!compact && <Link className="icon-button hide-mobile" aria-label="Notifications" href="/account"><Bell size={18}/><i /></Link>}
    <Link className="profile-button" aria-label="Account" href="/account"><UserRound size={17}/><span>My space</span></Link>
  </div>;
}
