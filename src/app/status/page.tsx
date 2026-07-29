import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/components/catalog/site-navigation";
import { StatusBoard } from "@/components/support/status-board";
export const metadata:Metadata={title:"Service Status"};
export default function StatusPage(){return <main className="support-page"><nav><Brand/><Link href="/help">Help center</Link><Link href="/support">Contact support</Link></nav><header><p>LIVE OPERATIONS</p><h1>AniVerse service status</h1><span>Current availability and recent incident updates across the platform.</span></header><StatusBoard/></main>}
