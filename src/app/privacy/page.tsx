import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/legal-shell";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalShell
      kicker="YOUR DATA"
      title="Privacy Policy"
      summary="What AniVerse collects, why it is used, and the controls available to you."
    >
      <section><h2>Information we collect</h2><p>We process account details, profile information, library and watch progress, creator submissions, community activity, support and moderation records, payment references, device/session information, consent history, and security logs. Uploaded media and subtitles are processed to provide creator and playback services.</p></section>
      <section><h2>How we use information</h2><p>Information is used to provide and secure AniVerse, synchronize your library, personalize recommendations when enabled, process creator publishing and payments, deliver notifications, moderate abuse, respond to legal requests, measure service performance, and comply with law.</p></section>
      <section><h2>Legal bases</h2><p>Depending on your location, processing relies on performing our contract, consent, legitimate interests in a safe and reliable service, and legal obligations. Optional playback analytics and marketing choices can be changed in account settings.</p></section>
      <section><h2>Sharing and processors</h2><p>Approved providers may process data for hosting, authentication, video delivery, email, payments, monitoring, and push notifications. We disclose only what is necessary, do not sell personal information, and may disclose information when required by law or to protect rights and safety.</p></section>
      <section><h2>Retention and security</h2><p>Records are kept only as long as needed for the purposes above, dispute resolution, security, and legal obligations. Retention differs by record type. AniVerse uses access controls, encryption in transit, encrypted backups, audit records, and service-role isolation, but no system can guarantee absolute security.</p></section>
      <section><h2>Your choices and rights</h2><p>You can adjust visibility, activity, personalization, analytics, notifications, blocks, sessions, exports, backups, and deletion from your account. Depending on local law, you may request access, correction, deletion, restriction, objection, portability, or withdrawal of consent. Withdrawal does not invalidate earlier lawful processing.</p></section>
      <section><h2>International use and children</h2><p>Providers may process information outside your country with appropriate safeguards. AniVerse is not directed to children who cannot legally consent to online services in their location. Contact privacy@aniverse.example to exercise a privacy right or ask a question.</p></section>
    </LegalShell>
  );
}
