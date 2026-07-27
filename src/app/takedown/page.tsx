import type { Metadata } from "next";
import { DmcaForm } from "@/components/legal/dmca-form";
import { LegalShell } from "@/components/legal/legal-shell";

export const metadata: Metadata = { title: "DMCA Takedown Request" };

export default function TakedownPage() {
  return (
    <LegalShell
      kicker="RIGHTS-HOLDER REQUEST"
      title="DMCA takedown notice"
      summary="Use this form only for copyright claims. Abuse, privacy, and community issues should use in-product reporting."
    >
      <section><h2>Before submitting</h2><p>Identify each protected work and provide the exact AniVerse URL for each allegedly infringing item. Incomplete notices can delay review. Your notice, including contact details, may be shared with the affected creator so they can understand and respond to the claim.</p></section>
      <section><h2>Legal notice form</h2><DmcaForm /></section>
      <section><h2>What happens next</h2><p>AniVerse records the notice, preserves review evidence, and assesses whether it contains the required elements. Material may be restricted while a claim is reviewed. The affected creator may appeal or submit a counter-notice. Knowingly making a material misrepresentation may expose the sender to liability.</p></section>
    </LegalShell>
  );
}
