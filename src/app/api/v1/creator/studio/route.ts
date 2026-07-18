import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { creatorStudioActionSchema, studioSlug, studioStatus } from "@/lib/creator-studio";

async function context() {
  if (!isSupabaseConfigured()) return { error: Response.json({ error: "Cloud creator studio is unavailable" }, { status: 503 }) };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: Response.json({ error: "Authentication required" }, { status: 401 }) };
  const { data: membership } = await supabase.from("creator_team_memberships").select("team_id,role").eq("user_id", user.id).order("joined_at").limit(1).maybeSingle();
  if (!membership) return { error: Response.json({ error: "Creator team access required" }, { status: 403 }) };
  return { user, membership, admin: getAdminClient() };
}

export async function GET() {
  const access = await context();
  if ("error" in access) return access.error;
  const { admin, membership } = access;
  const [{ data: team, error: teamError }, { data: titles, error: titleError }, { data: memberships }] = await Promise.all([
    admin.from("creator_teams").select("id,name").eq("id", membership.team_id).single(),
    admin.from("titles").select("id,name,status,seasons(episodes(id))").eq("creator_team_id", membership.team_id).order("created_at"),
    admin.from("creator_team_memberships").select("user_id,role").eq("team_id", membership.team_id).order("joined_at"),
  ]);
  if (teamError || titleError || !team) return Response.json({ error: "Could not load creator workspace" }, { status: 500 });
  const memberRows = memberships ?? [];
  const { data: profiles } = memberRows.length ? await admin.from("profiles").select("id,display_name,username").in("id", memberRows.map((item) => item.user_id)) : { data: [] };
  const names = new Map((profiles ?? []).map((profile) => [profile.id, profile.display_name || profile.username || "Creator"]));
  return Response.json({ workspace: {
    team: { id: team.id, name: team.name, role: membership.role, members: memberRows.map((item) => ({ name: names.get(item.user_id) ?? "Creator", role: item.role })) },
    titles: (titles ?? []).map((title) => ({ id: title.id, name: title.name, status: studioStatus(title.status), episodes: title.seasons.reduce((sum, season) => sum + season.episodes.length, 0) })),
  } }, { headers: { "cache-control": "private, no-store" } });
}

export async function POST(request: Request) {
  const access = await context();
  if ("error" in access) return access.error;
  if (!["owner", "editor"].includes(String(access.membership.role))) return Response.json({ error: "Editor access required" }, { status: 403 });
  const parsed = creatorStudioActionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid creator studio action" }, { status: 400 });
  const { admin, membership, user } = access;
  if (parsed.data.type === "add-member") {
    const memberAction = parsed.data;
    if (membership.role !== "owner") return Response.json({ error: "Owner access required" }, { status: 403 });
    const { data: users, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const invited = users.users.find((item) => item.email?.toLowerCase() === memberAction.email.toLowerCase());
    if (usersError || !invited) return Response.json({ error: "No registered AniVerse account uses that email" }, { status: 404 });
    if (invited.id === user.id) return Response.json({ error: "You are already the team owner" }, { status: 409 });
    const { error } = await admin.from("creator_team_memberships").upsert({ team_id: membership.team_id, user_id: invited.id, role: parsed.data.role, invited_by: user.id });
    if (error) return Response.json({ error: "Team member could not be added" }, { status: 500 });
    await admin.from("user_roles").upsert({ user_id: invited.id, role: "creator", granted_by: user.id });
    const { data: profile } = await admin.from("profiles").select("display_name,username").eq("id", invited.id).maybeSingle();
    return Response.json({ member: { name: profile?.display_name || profile?.username || invited.email || "Creator", role: parsed.data.role } }, { status: 201 });
  }
  if (parsed.data.type === "create-title") {
    const id = randomUUID();
    const { data, error } = await admin.from("titles").insert({ id, creator_team_id: membership.team_id, creator_user_id: user.id, slug: studioSlug(parsed.data.name, id), name: parsed.data.name, synopsis: "", status: "draft" }).select("id,name,status").single();
    if (error) return Response.json({ error: "Could not create title" }, { status: 500 });
    return Response.json({ title: { id: data.id, name: data.name, status: studioStatus(data.status), episodes: 0 } }, { status: 201 });
  }
  const { data: title } = await admin.from("titles").select("id").eq("id", parsed.data.titleId).eq("creator_team_id", membership.team_id).maybeSingle();
  if (!title) return Response.json({ error: "Title not found in this creator team" }, { status: 404 });
  let { data: season } = await admin.from("seasons").select("id").eq("title_id", title.id).eq("number", 1).maybeSingle();
  if (!season) {
    const created = await admin.from("seasons").insert({ title_id: title.id, number: 1, name: "Season 1" }).select("id").single();
    if (created.error) return Response.json({ error: "Could not create title season" }, { status: 500 });
    season = created.data;
  }
  const { count } = await admin.from("episodes").select("id", { count: "exact", head: true }).eq("season_id", season.id);
  const number = (count ?? 0) + 1;
  const { data: episode, error } = await admin.from("episodes").insert({ season_id: season.id, number, slug: `episode-${number}`, title: `Episode ${number}`, status: "draft" }).select("id,number,title,status").single();
  if (error) return Response.json({ error: "Could not create episode" }, { status: 500 });
  return Response.json({ episode }, { status: 201 });
}
