import { getAdminClient } from "@/lib/supabase/admin";
import { authorizeStaff } from "@/lib/supabase/authorization";
import { moderationActionSchema } from "@/lib/moderation";
export async function GET() {
  const access = await authorizeStaff();
  if (!access.ok) return access.response;
  const admin = getAdminClient();
  const [
    { data: reports },
    { data: appeals },
    { data: strikes },
    { data: settings },
    { count: users },
  ] = await Promise.all([
    admin
      .from("reports")
      .select("id,entity_type,entity_id,reason,status")
      .order("created_at"),
    admin
      .from("appeals")
      .select("id,appellant_id,statement,status")
      .order("created_at"),
    admin
      .from("creator_strikes")
      .select("id,creator_id,reason,revoked_at")
      .order("created_at", { ascending: false }),
    admin
      .from("platform_settings")
      .select("mature_content_enabled")
      .eq("id", true)
      .single(),
    admin.from("profiles").select("id", { count: "exact", head: true }),
  ]);
  const ids = [
    ...new Set([
      ...(appeals ?? []).map((item) => item.appellant_id),
      ...(strikes ?? []).map((item) => item.creator_id),
    ]),
  ];
  const { data: profiles } = ids.length
    ? await admin
        .from("profiles")
        .select("id,display_name,username")
        .in("id", ids)
    : { data: [] };
  const names = new Map(
    (profiles ?? []).map((item) => [
      item.id,
      item.display_name || item.username || "Creator",
    ]),
  );
  return Response.json(
    {
      moderation: {
        matureContentEnabled: settings?.mature_content_enabled ?? false,
        reports: (reports ?? []).map((item) => ({
          id: item.id,
          target: `${item.entity_type}: ${item.entity_id}`,
          reason: item.reason,
          status: item.status[0].toUpperCase() + item.status.slice(1),
        })),
        appeals: (appeals ?? []).map((item) => ({
          id: item.id,
          creator: names.get(item.appellant_id) ?? "Creator",
          reason: item.statement,
          status:
            item.status === "appealed"
              ? "Pending"
              : item.status[0].toUpperCase() + item.status.slice(1),
        })),
        strikes: (strikes ?? []).map((item) => ({
          creator: names.get(item.creator_id) ?? "Creator",
          reason: item.reason,
          active: !item.revoked_at,
        })),
      },
      users: users ?? 0,
    },
    { headers: { "cache-control": "private, no-store" } },
  );
}
export async function PATCH(request: Request) {
  const access = await authorizeStaff();
  if (!access.ok) return access.response;
  const user = access.user;
  const parsed = moderationActionSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return Response.json(
      { error: "Invalid moderation decision" },
      { status: 400 },
    );
  const admin = getAdminClient();
  const action = parsed.data;
  if (action.type === "mature-content") {
    const { error } = await admin
      .from("platform_settings")
      .update({
        mature_content_enabled: action.enabled,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", true);
    return error
      ? Response.json({ error: "Setting could not be saved" }, { status: 500 })
      : Response.json({ ok: true });
  }
  const table = action.type === "report" ? "reports" : "appeals";
  const targetColumn =
    action.type === "report" ? "reporter_id" : "appellant_id";
  const { data: target } = await admin
    .from(table)
    .select(targetColumn)
    .eq("id", action.id)
    .maybeSingle();
  const payload =
    action.type === "report"
      ? {
          status: action.decision,
          assigned_to: user.id,
          updated_at: new Date().toISOString(),
        }
      : {
          status: action.decision,
          reviewed_by: user.id,
          resolved_at: new Date().toISOString(),
        };
  const { error } = await admin.from(table).update(payload).eq("id", action.id);
  if (!error && target) {
    const targetUserId = String(
      (target as unknown as Record<string, string>)[targetColumn],
    );
    await admin.from("notifications").insert({
      user_id: targetUserId,
      type: "moderation",
      title:
        action.type === "report" ? "Report updated" : "Appeal decision ready",
      body: `Your ${action.type} was ${action.decision}.`,
      href: "/account/notifications",
    });
  }
  return error
    ? Response.json({ error: "Decision could not be saved" }, { status: 500 })
    : Response.json({ ok: true });
}
