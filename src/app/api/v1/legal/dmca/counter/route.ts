import { dmcaCounterNoticeSchema } from "@/lib/legal";
import { getAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

async function creatorAccess() {
  if (!isSupabaseConfigured())
    return { response: Response.json({ error: "Cloud access unavailable" }, { status: 503 }) };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return { response: Response.json({ error: "Authentication required" }, { status: 401 }) };
  return { user, supabase };
}

export async function GET() {
  const access = await creatorAccess();
  if ("response" in access) return access.response;
  const { data: notices, error } = await access.supabase
    .from("dmca_counter_notices")
    .select("id,request_id,statement,status,submitted_at,review_notes")
    .eq("submitter_id", access.user.id)
    .order("submitted_at", { ascending: false });
  return error
    ? Response.json({ error: "Counter notices could not be loaded" }, { status: 500 })
    : Response.json(
        { counterNotices: notices ?? [] },
        { headers: { "cache-control": "private, no-store" } },
      );
}

export async function POST(request: Request) {
  const access = await creatorAccess();
  if ("response" in access) return access.response;
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return Response.json({ error: "Untrusted counter-notice origin" }, { status: 403 });
  const parsed = dmcaCounterNoticeSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return Response.json({ error: "Complete every required declaration" }, { status: 400 });

  const admin = getAdminClient();
  const { data: target } = await admin
    .from("dmca_requests")
    .select("id,title_id,titles(creator_team_id)")
    .eq("id", parsed.data.requestId)
    .in("status", ["reviewing", "actioned"])
    .single();
  const teamId = (target?.titles as unknown as { creator_team_id: string } | null)
    ?.creator_team_id;
  const { data: membership } = teamId
    ? await admin
        .from("creator_team_memberships")
        .select("role")
        .eq("team_id", teamId)
        .eq("user_id", access.user.id)
        .in("role", ["owner", "editor"])
        .maybeSingle()
    : { data: null };
  if (!target || !membership)
    return Response.json({ error: "This request is not linked to your title" }, { status: 403 });

  const { data, error } = await admin
    .from("dmca_counter_notices")
    .insert({
      request_id: parsed.data.requestId,
      submitter_id: access.user.id,
      contact_email: parsed.data.contactEmail,
      statement: parsed.data.statement,
      good_faith_confirmed: parsed.data.goodFaithConfirmed,
      jurisdiction_confirmed: parsed.data.jurisdictionConfirmed,
      signature: parsed.data.signature,
    })
    .select("id,status,submitted_at")
    .single();
  if (error)
    return Response.json({ error: "Counter notice could not be recorded" }, { status: 409 });
  await Promise.all([
    admin.from("dmca_request_events").insert({
      request_id: parsed.data.requestId,
      actor_id: access.user.id,
      event_type: "counter_notice_submitted",
    }),
    admin
      .from("dmca_requests")
      .update({ status: "reviewing" })
      .eq("id", parsed.data.requestId),
  ]);
  return Response.json({ counterNotice: data }, { status: 201 });
}
