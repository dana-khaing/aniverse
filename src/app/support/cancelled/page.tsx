import Link from "next/link";
import { PublicHeader } from "@/components/catalog/public-header";
export default function TipCancelledPage(){return <><PublicHeader/><main className="payment-result cancelled"><p>CHECKOUT CANCELLED</p><h1>No payment was made.</h1><span>Every AniVerse title remains free to watch. You can return whenever you like.</span><div><Link href="/browse">Keep browsing</Link><Link href="/">Go home</Link></div></main></>}
