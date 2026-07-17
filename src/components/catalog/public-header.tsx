import Link from "next/link";
import { messages,type Locale } from "@/lib/i18n";
import { Brand, HeaderActions, MobileDock } from "@/components/catalog/site-navigation";
export function PublicHeader({locale="en"}:{locale?:Locale}){const copy=messages[locale];const prefix=`/${locale}`;return <><header className="catalog-header"><Brand href={prefix}/><nav aria-label="Primary navigation"><Link href={prefix}>{copy.home}</Link><Link href={`${prefix}/browse`}>{copy.browse}</Link><Link href="/schedule">{copy.schedule}</Link><Link href="/charts/seasonal">Charts</Link><Link href="/community">{copy.community}</Link></nav><HeaderActions compact/></header><MobileDock/></>}
