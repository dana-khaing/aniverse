import type { Metadata } from "next";
import { DmcaCounterCenter } from "@/components/legal/dmca-counter-center";
import { LegalShell } from "@/components/legal/legal-shell";

export const metadata: Metadata = { title: "Creator DMCA Center" };
export default function CreatorDmcaPage(){return <LegalShell kicker="CREATOR RIGHTS" title="Copyright response center" summary="Review copyright notices linked to your titles and submit a legally complete counter-notice when material was removed by mistake or misidentification."><section><h2>Affected notices</h2><DmcaCounterCenter/></section></LegalShell>}
