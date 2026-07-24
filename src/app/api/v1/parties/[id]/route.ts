import { partyActionSchema, canManageParty } from "@/lib/watch-party";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

async function context(id: string) {
  if (!isSupabaseConfigured())
    return {
      error: Response.json(
        { error: "Cloud parties are unavailable" },
        { status: 503 },
      ),
    };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return {
      error: Response.json(
        { error: "Authentication required" },
        { status: 401 },
      ),
    };
  const { data: party } = await supabase
    .from("watch_parties")
    .select(
      "id,host_id,title_id,episode_id,name,status,invite_code,starts_at,playback_position,playback_state,sequence",
    )
    .eq("id", id)
    .maybeSingle();
  if (!party)
    return {
      error: Response.json(
        { error: "Party not found or unavailable" },
        { status: 404 },
      ),
    };
  const { data: membership } = await supabase
    .from("watch_party_members")
    .select("role")
    .eq("party_id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  const role = party.host_id === user.id ? "host" : membership?.role;
  if (!role)
    return {
      error: Response.json(
        { error: "Party membership required" },
        { status: 403 },
      ),
    };
  return { supabase, user, party, role };
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await context(id);
  if ("error" in access) return access.error;
  const { data: members } = await access.supabase
    .from("watch_party_members")
    .select("user_id,role,joined_at,profiles(username,display_name,avatar_url)")
    .eq("party_id", id)
    .order("joined_at");
  const { data: invitations } = canManageParty(access.role)
    ? await access.supabase
        .from("watch_party_invitations")
        .select("id,email,role,status,expires_at,created_at")
        .eq("party_id", id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
    : { data: [] };
  return Response.json(
    {
      party: access.party,
      role: access.role,
      members: members ?? [],
      invitations: invitations ?? [],
    },
    { headers: { "cache-control": "private, no-store" } },
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return Response.json({ error: "Untrusted party action" }, { status: 403 });
  const { id } = await params;
  const access = await context(id);
  if ("error" in access) return access.error;
  const parsed = partyActionSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return Response.json({ error: "Invalid party action" }, { status: 400 });
  if (parsed.data.action === "presence") {
    const { data: membership } = await access.supabase
      .from("watch_party_members")
      .select("reconnect_count")
      .eq("party_id", id)
      .eq("user_id", access.user.id)
      .maybeSingle();
    const { error } = await access.supabase
      .from("watch_party_members")
      .update({
        connection_state: parsed.data.state,
        last_seen_at: new Date().toISOString(),
        reconnect_count:
          (membership?.reconnect_count ?? 0) +
          (parsed.data.reconnected ? 1 : 0),
      })
      .eq("party_id", id)
      .eq("user_id", access.user.id);
    if (error)
      return Response.json(
        { error: "Presence could not be updated" },
        { status: 500 },
      );
    return Response.json({ state: parsed.data.state });
  }
  if (!canManageParty(access.role))
    return Response.json(
      { error: "Host or moderator permission required" },
      { status: 403 },
    );
  const action = parsed.data;
  if (action.action === "invite") {
    const { data, error } = await access.supabase
      .from("watch_party_invitations")
      .insert({
        party_id: id,
        invited_by: access.user.id,
        email: action.email.toLowerCase(),
        role: action.role,
      })
      .select("id,email,role,status,expires_at,created_at")
      .single();
    if (error)
      return Response.json(
        { error: "Invitation could not be created" },
        { status: 500 },
      );
    return Response.json({ invitation: data }, { status: 201 });
  }
  if (action.action === "lifecycle") {
    if (access.role !== "host")
      return Response.json(
        { error: "Only the host can change party status" },
        { status: 403 },
      );
    const { data, error } = await access.supabase
      .from("watch_parties")
      .update({ status: action.status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("status")
      .single();
    if (error)
      return Response.json(
        { error: "Party status could not be changed" },
        { status: 500 },
      );
    return Response.json({ status: data.status });
  }
  if (access.role !== "host")
    return Response.json(
      { error: "Only the host can manage participant roles" },
      { status: 403 },
    );
  if (action.userId === access.party.host_id)
    return Response.json(
      { error: "The host cannot be changed or removed" },
      { status: 409 },
    );
  if (action.action === "member-role") {
    const { error } = await access.supabase
      .from("watch_party_members")
      .update({ role: action.role })
      .eq("party_id", id)
      .eq("user_id", action.userId);
    if (error)
      return Response.json(
        { error: "Participant role could not be changed" },
        { status: 500 },
      );
    return Response.json({ userId: action.userId, role: action.role });
  }
  const { error } = await access.supabase
    .from("watch_party_members")
    .delete()
    .eq("party_id", id)
    .eq("user_id", action.userId);
  if (error)
    return Response.json(
      { error: "Participant could not be removed" },
      { status: 500 },
    );
  return new Response(null, { status: 204 });
}
