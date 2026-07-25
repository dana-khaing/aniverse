import { auditFilterSchema, auditSummary } from "@/lib/audit-history";
import { getAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

async function staff() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .in("role", ["moderator", "admin"])
    .limit(1)
    .maybeSingle();
  return role ? user : null;
}

export async function GET(request: Request) {
  if (!(await staff()))
    return Response.json({ error: "Staff access required" }, { status: 403 });
  const url = new URL(request.url);
  const parsed = auditFilterSchema.safeParse({
    action: url.searchParams.get("action") || undefined,
    entityType: url.searchParams.get("entityType") || undefined,
    cursor: url.searchParams.get("cursor") || undefined,
    limit: url.searchParams.get("limit") || undefined,
  });
  if (!parsed.success)
    return Response.json({ error: "Invalid audit filters" }, { status: 400 });
  const admin = getAdminClient();
  let query = admin
    .from("audit_logs")
    .select("id,actor_id,action,entity_type,entity_id,metadata,created_at")
    .order("created_at", { ascending: false })
    .limit(parsed.data.limit);
  if (parsed.data.action)
    query = query.ilike("action", `${parsed.data.action}%`);
  if (parsed.data.entityType)
    query = query.eq("entity_type", parsed.data.entityType);
  if (parsed.data.cursor) query = query.lt("created_at", parsed.data.cursor);
  const { data, error } = await query;
  if (error)
    return Response.json(
      { error: "Audit history could not be loaded" },
      { status: 500 },
    );
  const actorIds = [
    ...new Set((data ?? []).map((entry) => entry.actor_id).filter(Boolean)),
  ];
  const { data: actors } = actorIds.length
    ? await admin
        .from("profiles")
        .select("id,display_name,username")
        .in("id", actorIds)
    : { data: [] };
  const names = new Map(
    (actors ?? []).map((actor) => [
      actor.id,
      actor.display_name || actor.username || "Staff",
    ]),
  );
  const entries = (data ?? []).map((entry) => ({
    ...entry,
    actor: entry.actor_id
      ? (names.get(entry.actor_id) ?? "Staff")
      : "AniVerse automation",
    summary: auditSummary(entry),
  }));
  return Response.json(
    { entries, nextCursor: entries.at(-1)?.created_at ?? null },
    { headers: { "cache-control": "private, no-store" } },
  );
}
