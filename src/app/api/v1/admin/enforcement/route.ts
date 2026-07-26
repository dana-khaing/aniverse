import { enforcementActionSchema } from "@/lib/moderation";
import { getAdminClient } from "@/lib/supabase/admin";
import { authorizeStaff } from "@/lib/supabase/authorization";

export async function GET() {
  const access = await authorizeStaff();
  if (!access.ok) return access.response;
  const admin = getAdminClient();
  const [{ data: takedowns }, { data: appeals }] = await Promise.all([
    admin
      .from("takedowns")
      .select(
        "id,title_id,claimant_name,claimant_email,rights_basis,status,executed_at,titles(name,status)",
      )
      .order("created_at"),
    admin
      .from("appeals")
      .select(
        "id,appellant_id,statement,status,outcome,review_notes,remediation,creator_strikes(reason,takedown_id)",
      )
      .order("created_at"),
  ]);
  const userIds = [
    ...new Set((appeals ?? []).map((item) => item.appellant_id)),
  ];
  const { data: profiles } = userIds.length
    ? await admin
        .from("profiles")
        .select("id,display_name,username")
        .in("id", userIds)
    : { data: [] };
  const names = new Map(
    (profiles ?? []).map((profile) => [
      profile.id,
      profile.display_name || profile.username || "Creator",
    ]),
  );
  return Response.json(
    {
      takedowns: takedowns ?? [],
      appeals: (appeals ?? []).map((appeal) => ({
        ...appeal,
        creator: names.get(appeal.appellant_id) ?? "Creator",
      })),
    },
    { headers: { "cache-control": "private, no-store" } },
  );
}

export async function PATCH(request: Request) {
  const access = await authorizeStaff();
  if (!access.ok) return access.response;
  const user = access.user;
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return Response.json(
      { error: "Untrusted enforcement origin" },
      { status: 403 },
    );
  const parsed = enforcementActionSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return Response.json(
      { error: "Invalid enforcement action" },
      { status: 400 },
    );
  const admin = getAdminClient();
  const action = parsed.data;
  const { error } =
    action.action === "execute-takedown"
      ? await admin.rpc("execute_title_takedown", {
          target_takedown_id: action.id,
          reviewer_id: user.id,
          notes: action.notes,
        })
      : await admin.rpc("resolve_creator_appeal", {
          target_appeal_id: action.id,
          reviewer_id: user.id,
          decision: action.decision,
          notes: action.notes,
        });
  if (error)
    return Response.json(
      { error: "Enforcement transaction failed" },
      { status: 409 },
    );
  await admin.from("audit_logs").insert({
    actor_id: user.id,
    action:
      action.action === "execute-takedown"
        ? "takedown.executed"
        : `appeal.${action.decision}`,
    entity_type: action.action === "execute-takedown" ? "takedown" : "appeal",
    entity_id: action.id,
    metadata: { notes: action.notes },
  });
  return Response.json({ ok: true });
}
