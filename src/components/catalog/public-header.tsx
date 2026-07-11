import Link from "next/link";
import { Search, UserRound } from "lucide-react";
export function PublicHeader(){return <header className="catalog-header"><Link className="brand" href="/"><span className="brand-orbit"><span/></span><span>Ani<span>Verse</span></span></Link><nav><Link href="/">Home</Link><Link href="/browse">Browse</Link><Link href="/schedule">Schedule</Link><Link href="/community">Community</Link></nav><div><Link aria-label="Search" href="/browse"><Search size={18}/></Link><Link aria-label="Account" href="/account"><UserRound size={18}/></Link></div></header>}
