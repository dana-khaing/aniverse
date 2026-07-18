import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const actionSchema = z.object({ invitationId: z.string().uuid(), action: z.enum(["accept", "decline"]) });

async function authenticated() {
  if (!isSupabaseConfigured()) return { error: Response.json({ error: "Cloud invitations are unavailable" }, { status: 503 }) };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { error: Response.json({ error: "Authentication required" }, { status: 401 }) };
  return { user, email: user.email, admin: getAdminClient() };
}

export async function GET() {
  const access = await authenticated();
  if ("error" in access) return access.error;
  const { data, error } = await access.admin.from("creator_team_invitations").select("id,role,expires_at,creator_teams(name)").ilike("email", access.email).is("accepted_at", null).gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false });
  if (error) return Response.json({ error: "Invitations could not be loaded" }, { status: 500 });
  return Response.json({ invitations: (data ?? []).map((item) => ({ id: item.id, team: (item.creator_teams as unknown as { name: string }).name, role: item.role, expiresAt: item.expires_at })) }, { headers: { "cache-control": "private, no-store" } });
}

export async function POST(request: Request) {
  const access = await authenticated();
  if ("error" in access) return access.error;
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid invitation action" }, { status: 400 });
  const { data: invitation } = await access.admin.from("creator_team_invitations").select("id,team_id,role,expires_at").eq("id", parsed.data.invitationId).ilike("email", access.email).is("accepted_at", null).maybeSingle();
  if (!invitation || new Date(invitation.expires_at) <= new Date()) return Response.json({ error: "Invitation not found or expired" }, { status: 404 });
  if (parsed.data.action === "decline") {
    const { error } = await access.admin.from("creator_team_invitations").delete().eq("id", invitation.id);
    return error ? Response.json({ error: "Invitation could not be declined" }, { status: 500 }) : Response.json({ declined: true });
  }
  const { error } = await access.admin.from("creator_team_memberships").upsert({ team_id: invitation.team_id, user_id: access.user.id, role: invitation.role, invited_by: null });
  if (error) return Response.json({ error: "Invitation could not be accepted" }, { status: 500 });
  await Promise.all([
    access.admin.from("creator_team_invitations").update({ accepted_at: new Date().toISOString() }).eq("id", invitation.id),
    access.admin.from("user_roles").upsert({ user_id: access.user.id, role: "creator" }),
  ]);
  return Response.json({ accepted: true, teamId: invitation.team_id });
}
