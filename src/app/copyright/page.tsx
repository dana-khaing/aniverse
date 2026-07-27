import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell } from "@/components/legal/legal-shell";

export const metadata: Metadata = { title: "Copyright Notice" };

export default function CopyrightPage() {
  return (
    <LegalShell
      kicker="CREATOR RIGHTS"
      title="Copyright Notice"
      summary="AniVerse supports original work and responds to complete rights-holder notices."
    >
      <section><h2>Ownership</h2><p>AniVerse branding, product design, software, and service materials are protected by applicable intellectual-property laws. Creators and licensors own their respective series, episodes, artwork, audio, subtitles, trailers, and related materials.</p></section>
      <section><h2>Permitted use</h2><p>Viewing content through the intended player does not transfer ownership. Unless a rights holder permits it, you may not copy, redistribute, publicly perform, remove rights information, circumvent playback controls, or create derivative works from content hosted on AniVerse.</p></section>
      <section><h2>Rights-holder notices</h2><p>If you believe material on AniVerse infringes your copyright, submit a complete notice identifying the protected work, the exact material location, your contact information, required good-faith statements, and an electronic signature.</p><Link className="legal-action" href="/takedown">Submit a DMCA notice</Link></section>
      <section><h2>Counter-notices and repeat infringement</h2><p>Affected creators may receive notice and an opportunity to appeal or provide a legally valid counter-notice where applicable. AniVerse may remove material and restrict or terminate repeat infringers while preserving evidence and audit history required for disputes.</p></section>
    </LegalShell>
  );
}
