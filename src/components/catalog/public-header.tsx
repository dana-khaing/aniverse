import Link from "next/link";
import { Search, UserRound } from "lucide-react";
import { messages,type Locale } from "@/lib/i18n";
export function PublicHeader({locale="en"}:{locale?:Locale}){const copy=messages[locale];const prefix=`/${locale}`;return <header className="catalog-header"><Link className="brand" href={prefix}><span className="brand-orbit"><span/></span><span>Ani<span>Verse</span></span></Link><nav><Link href={prefix}>{copy.home}</Link><Link href={`${prefix}/browse`}>{copy.browse}</Link><Link href="/schedule">{copy.schedule}</Link><Link href="/community">{copy.community}</Link></nav><div><Link aria-label="Search" href="/browse"><Search size={18}/></Link><Link aria-label="Account" href="/account"><UserRound size={18}/></Link></div></header>}
