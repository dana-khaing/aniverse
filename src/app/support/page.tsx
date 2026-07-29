import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/components/catalog/site-navigation";
import { SupportCenter } from "@/components/support/support-center";

export const metadata: Metadata = { title: "Support" };
export default function SupportPage(){return <main className="support-page"><nav><Brand/><Link href="/help">Help center</Link><Link href="/status">Service status</Link></nav><header><p>ANIVERSE SUPPORT</p><h1>We’ll help you get back to the story.</h1><span>Tracked requests keep account, playback, creator, billing, and safety conversations in one place.</span></header><SupportCenter/></main>}
