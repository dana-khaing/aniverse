"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  CalendarDays,
  Compass,
  Home,
  Library,
  BarChart3,
  ChevronDown,
  MessageCircle,
  Clapperboard,
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
      <MoreMenu locale={locale} dock />
    </nav>
  );
}

export function MoreMenu({ locale="en", dock=false }: { locale?:Locale; dock?:boolean }) {
  const [open,setOpen]=useState(false); const root=useRef<HTMLDivElement>(null); const trigger=useRef<HTMLButtonElement>(null); const pathname=usePathname();
  const labels=locale==="ja"?{more:"その他",charts:"ランキング",community:"コミュニティ",creators:"クリエイター",library:"ライブラリ",account:"アカウント"}:{more:"More",charts:"Charts",community:"Community",creators:"Creators",library:"Library",account:"Account"};
  useEffect(()=>{if(!open)return;const close=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false)};const escape=(event:KeyboardEvent)=>{if(event.key==="Escape"){setOpen(false);trigger.current?.focus()}};document.addEventListener("pointerdown",close);document.addEventListener("keydown",escape);return()=>{document.removeEventListener("pointerdown",close);document.removeEventListener("keydown",escape)}},[open]);
  const links=[{label:labels.charts,href:localePath(locale,"/charts/seasonal"),icon:BarChart3},{label:labels.community,href:localePath(locale,"/community"),icon:MessageCircle},{label:labels.creators,href:localePath(locale,"/creators"),icon:Clapperboard},{label:labels.library,href:"/library",icon:Library},{label:labels.account,href:"/account",icon:UserRound}];
  return <div ref={root} className={`more-menu${dock?" dock-more":""}`}><button ref={trigger} aria-haspopup="menu" aria-expanded={open} onClick={()=>setOpen(value=>!value)}>{dock?<Compass size={19}/>:null}<span>{labels.more}</span>{!dock&&<ChevronDown size={13}/>}</button>{open&&<div role="menu">{links.map(({label,href,icon:Icon})=><Link key={href} role="menuitem" aria-current={pathname===href?"page":undefined} href={href} onClick={()=>setOpen(false)}><Icon size={16}/>{label}</Link>)}</div>}</div>;
}

export function HeaderActions({
  compact = false,
  showSearch = true,
  locale = "en",
}: {
  compact?: boolean;
  showSearch?: boolean;
  locale?: Locale;
}) {
  const copy = messages[locale].nav;
  return (
    <div className="header-actions">
      {showSearch && <Link
        className="icon-button"
        aria-label={copy.search}
        href={localePath(locale, "/browse")}
      >
        <Search size={18} />
      </Link>}
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
