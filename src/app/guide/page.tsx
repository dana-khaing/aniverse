import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/components/catalog/site-navigation";
import { WebsiteGuide } from "@/components/support/website-guide";
import "./guide.css";

export const metadata: Metadata = {
  title: "Website Guide",
  description: "Learn how to watch, build lists, join parties, publish, and manage your AniVerse account.",
};

export default function GuidePage() {
  return (
    <main className="website-guide-page">
      <nav className="guide-nav" aria-label="Guide navigation">
        <Brand />
        <div>
          <Link href="/help">Help center</Link>
          <Link href="/status">Service status</Link>
          <Link className="guide-support-link" href="/support">Contact support</Link>
        </div>
      </nav>
      <WebsiteGuide />
    </main>
  );
}
