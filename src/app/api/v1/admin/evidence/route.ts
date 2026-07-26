import { evidenceDecisionSchema } from "@/lib/moderation";
import { getAdminClient } from "@/lib/supabase/admin";
import { authorizeStaff } from "@/lib/supabase/authorization";

export async function GET() {
  const access = await authorizeStaff();
  if (!access.ok) return access.response;
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("report_evidence")
    .select(
      "id,report_id,kind,source_url,description,sha256,review_status,review_notes,created_at,reports(reason,entity_type,entity_id)",
    )
    .order("created_at");
  if (error)
    return Response.json(
      { error: "Evidence queue could not be loaded" },
      { status: 500 },
    );
  return Response.json(
    { evidence: data ?? [] },
    { headers: { "cache-control": "private, no-store" } },
  );
}

export async function PATCH(request: Request) {
  const access = await authorizeStaff();
  if (!access.ok) return access.response;
  const user = access.user;
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return Response.json({ error: "Untrusted review origin" }, { status: 403 });
  const parsed = evidenceDecisionSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return Response.json(
      { error: "Invalid evidence decision" },
      { status: 400 },
    );
  const admin = getAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("report_evidence")
    .update({
      review_status: parsed.data.decision,
      review_notes: parsed.data.notes || null,
      reviewed_by: user.id,
      reviewed_at: now,
    })
    .eq("id", parsed.data.id)
    .eq("review_status", "pending")
    .select("id,report_id,review_status")
    .maybeSingle();
  if (error)
    return Response.json(
      { error: "Evidence review could not be saved" },
      { status: 500 },
    );
  if (!data)
    return Response.json(
      { error: "Evidence was already reviewed" },
      { status: 409 },
    );
  await admin.from("audit_logs").insert({
    actor_id: user.id,
    action: `report_evidence.${parsed.data.decision}`,
    entity_type: "report_evidence",
    entity_id: data.id,
    metadata: { report_id: data.report_id, notes: parsed.data.notes },
  });
  return Response.json({ evidence: data });
}
