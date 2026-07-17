import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { releaseLabel, releaseSchema } from "@/lib/creator-releases";

async function access() {
  if (!isSupabaseConfigured()) return { error: Response.json({ error: "Cloud releases are unavailable" }, { status: 503 }) };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: Response.json({ error: "Authentication required" }, { status: 401 }) };
  const { data: membership } = await supabase.from("creator_team_memberships").select("team_id,role").eq("user_id", user.id).order("joined_at").limit(1).maybeSingle();
  if (!membership) return { error: Response.json({ error: "Creator team access required" }, { status: 403 }) };
  return { user, membership, admin: getAdminClient() };
}

export async function GET() {
  const context = await access(); if ("error" in context) return context.error;
  const { data, error } = await context.admin.from("creator_releases").select("id,title,kind,status,scheduled_at").eq("team_id", context.membership.team_id).order("scheduled_at", { ascending: false });
  if (error) return Response.json({ error: "Could not load release calendar" }, { status: 500 });
  return Response.json({ releases: (data ?? []).map((item) => ({ id: item.id, title: item.title, kind: releaseLabel(item.kind), status: releaseLabel(item.status), scheduledAt: item.scheduled_at })) }, { headers: { "cache-control": "private, no-store" } });
}

export async function POST(request: Request) {
  const context = await access(); if ("error" in context) return context.error;
  if (!["owner", "editor"].includes(String(context.membership.role))) return Response.json({ error: "Editor access required" }, { status: 403 });
  const parsed = releaseSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid release schedule" }, { status: 400 });
  const { data, error } = await context.admin.from("creator_releases").insert({ team_id: context.membership.team_id, created_by: context.user.id, title: parsed.data.title, kind: parsed.data.kind.toLowerCase(), status: "scheduled", scheduled_at: parsed.data.scheduledAt }).select("id,title,kind,status,scheduled_at").single();
  if (error) return Response.json({ error: "Could not schedule release" }, { status: 500 });
  return Response.json({ release: { id: data.id, title: data.title, kind: releaseLabel(data.kind), status: releaseLabel(data.status), scheduledAt: data.scheduled_at } }, { status: 201 });
}
