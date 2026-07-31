import { dmcaAdminActionSchema } from "@/lib/legal";
import { getAdminClient } from "@/lib/supabase/admin";
import { authorizeStaff } from "@/lib/supabase/authorization";

export async function GET() {
  const access = await authorizeStaff();
  if (!access.ok) return access.response;
  const admin = getAdminClient();
  const [{ data: requests }, { data: counters }, { data: titles }] =
    await Promise.all([
      admin
        .from("dmca_requests")
        .select(
          "id,claimant_name,claimant_email,organization,work_description,material_urls,status,submitted_at,reviewed_at,title_id,review_notes,actioned_at,titles(name,status),dmca_request_events(id,event_type,notes,created_at,actor_id)",
        )
        .order("submitted_at", { ascending: false }),
      admin
        .from("dmca_counter_notices")
        .select(
          "id,request_id,submitter_id,contact_email,statement,status,submitted_at,review_notes",
        )
        .order("submitted_at", { ascending: false }),
      admin
        .from("titles")
        .select("id,name,status")
        .neq("status", "removed")
        .order("name"),
    ]);
  return Response.json(
    {
      requests: requests ?? [],
      counterNotices: counters ?? [],
      titles: titles ?? [],
    },
    { headers: { "cache-control": "private, no-store" } },
  );
}

export async function PATCH(request: Request) {
  const access = await authorizeStaff(request);
  if (!access.ok) return access.response;
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return Response.json({ error: "Untrusted DMCA origin" }, { status: 403 });
  const parsed = dmcaAdminActionSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return Response.json({ error: "Invalid DMCA action" }, { status: 400 });

  const admin = getAdminClient();
  const action = parsed.data;
  if (action.action === "execute" && !access.roles.includes("admin"))
    return Response.json(
      { error: "Administrator access required for takedown execution" },
      { status: 403 },
    );

  let error: { message: string } | null = null;
  let auditAction = "";
  if (action.action === "review") {
    const result = await admin.rpc("review_dmca_request", {
      target_request_id: action.id,
      reviewer_id: access.user.id,
      decision: action.decision,
      notes: action.notes,
      target_title_id: action.titleId,
    });
    error = result.error;
    auditAction = `dmca.${action.decision}`;
  } else if (action.action === "execute") {
    const result = await admin.rpc("execute_dmca_takedown", {
      target_request_id: action.id,
      reviewer_id: access.user.id,
      notes: action.notes,
    });
    error = result.error;
    auditAction = "dmca.takedown_executed";
  } else {
    const result = await admin
      .from("dmca_counter_notices")
      .update({
        status: action.decision,
        review_notes: action.notes,
        reviewed_at: new Date().toISOString(),
        reviewed_by: access.user.id,
      })
      .eq("id", action.id)
      .in("status", ["submitted", "reviewing"]);
    error = result.error;
    auditAction = `dmca.counter.${action.decision}`;
  }
  if (error)
    return Response.json(
      { error: "DMCA decision could not be completed" },
      { status: 409 },
    );
  await admin.from("audit_logs").insert({
    actor_id: access.user.id,
    action: auditAction,
    entity_type: action.action === "counter" ? "dmca_counter" : "dmca_request",
    entity_id: action.id,
    metadata: { notes: action.notes },
  });
  return Response.json({ ok: true });
}
