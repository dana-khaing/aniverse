import { createHash } from "node:crypto";
import { dmcaRequestSchema } from "@/lib/legal";
import { consumeRateLimit, spamScore } from "@/lib/security";
import { getAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return Response.json({ error: "Untrusted submission origin" }, { status: 403 });
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY)
    return Response.json(
      { error: "Online legal submissions are not configured" },
      { status: 503 },
    );
  const clientAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const rateKey = createHash("sha256").update(clientAddress).digest("hex");
  if (!consumeRateLimit(`dmca:${rateKey}`, 3, 1 / 3600))
    return Response.json(
      { error: "Too many submissions. Try again later." },
      { status: 429, headers: { "retry-after": "3600" } },
    );
  const parsed = dmcaRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return Response.json(
      { error: "Complete every required declaration" },
      { status: 400 },
    );
  if (
    spamScore(
      `${parsed.data.workDescription} ${parsed.data.organization} ${parsed.data.materialUrls.join(" ")}`,
    ) >= 8
  )
    return Response.json({ error: "Submission could not be accepted" }, { status: 422 });
  const { data, error } = await getAdminClient()
    .from("dmca_requests")
    .insert({
      claimant_name: parsed.data.claimantName,
      claimant_email: parsed.data.claimantEmail,
      organization: parsed.data.organization || null,
      work_description: parsed.data.workDescription,
      material_urls: parsed.data.materialUrls,
      good_faith_confirmed: parsed.data.goodFaithConfirmed,
      accuracy_confirmed: parsed.data.accuracyConfirmed,
      signature: parsed.data.signature,
    })
    .select("id,submitted_at")
    .single();
  return error
    ? Response.json({ error: "Submission could not be recorded" }, { status: 500 })
    : Response.json({ request: data }, { status: 201 });
}
