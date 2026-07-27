import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/legal-shell";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalShell
      kicker="SERVICE AGREEMENT"
      title="Terms of Service"
      summary="The rules that keep AniVerse safe for viewers, creators, and rights holders."
    >
      <section><h2>1. Your account</h2><p>You must provide accurate account information, protect your credentials, and be old enough to consent to this service under the law where you live. You are responsible for activity performed through your account. We may suspend access when necessary to protect users, rights holders, or the service.</p></section>
      <section><h2>2. The service</h2><p>AniVerse provides discovery, community, creator publishing, and streaming tools. Features may change, experience interruptions, or differ by territory. A license to use AniVerse is personal, limited, non-exclusive, revocable, and may not be resold or used to scrape, bypass, disrupt, or reverse engineer the service.</p></section>
      <section><h2>3. Creator content</h2><p>Creators retain ownership of their work. By publishing, a creator grants AniVerse the rights needed to host, encode, stream, promote, moderate, and make the work available as selected in Creator Studio. Creators promise they control all required rights, including music, artwork, subtitles, performances, and trademarks.</p></section>
      <section><h2>4. Community conduct</h2><p>Do not harass, threaten, impersonate, spam, evade enforcement, expose private information, sexualize minors, promote illegal harm, or upload infringing material. Ratings, reviews, chats, and profiles may be moderated. Reports and appeals are reviewed under our published processes.</p></section>
      <section><h2>5. Payments</h2><p>Tips and other payments may be processed by third-party providers. Fees, taxes, refunds, chargebacks, and creator payout eligibility follow the terms shown at checkout and the provider’s rules. Do not use payments for fraud, laundering, or prohibited goods.</p></section>
      <section><h2>6. Enforcement and termination</h2><p>We may remove content, restrict features, issue creator strikes, suspend accounts, or terminate access when these terms, law, or platform safety require it. Where appropriate, AniVerse provides notice and an appeal route. You may stop using the service or delete your account in account settings.</p></section>
      <section><h2>7. Disclaimers and liability</h2><p>The service is provided on an “as available” basis to the extent permitted by law. AniVerse does not promise uninterrupted availability or that all user content is accurate. Nothing in these terms excludes rights or liability that cannot legally be excluded. Otherwise, liability is limited to reasonably foreseeable direct loss.</p></section>
      <section><h2>8. Changes and contact</h2><p>Material changes will be identified by a new effective date and, when appropriate, an in-product or email notice. Continued use after the effective date means the updated terms apply. Contact legal@aniverse.example for legal questions.</p></section>
    </LegalShell>
  );
}
