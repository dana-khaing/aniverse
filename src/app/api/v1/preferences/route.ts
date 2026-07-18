import { z } from "zod";
import { getAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  personalizationEnabled: z.boolean().optional(),
  playbackAnalyticsEnabled: z.boolean().optional(),
  profileVisibility: z.enum(["public", "followers", "private"]).optional(),
  showActivity: z.boolean().optional(),
  clearBlocked: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0);

export async function GET() {
  if (!isSupabaseConfigured()) return Response.json({ error: "Cloud preferences are unavailable" }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });

  const admin = getAdminClient();
  const [{ data }, { data: profile }, { data: blocks }] = await Promise.all([
    supabase.from("user_preferences").select("personalization_enabled,playback_analytics_enabled").eq("user_id", user.id).maybeSingle(),
    supabase.from("profiles").select("profile_visibility,show_activity").eq("id", user.id).single(),
    admin.from("blocked_users").select("blocked_id").eq("blocker_id", user.id),
  ]);
  const ids = (blocks ?? []).map((item) => item.blocked_id);
  const { data: names } = ids.length
    ? await admin.from("profiles").select("id,username,display_name").in("id", ids)
    : { data: [] };

  return Response.json({ preferences: {
    personalizationEnabled: data?.personalization_enabled ?? true,
    playbackAnalyticsEnabled: data?.playback_analytics_enabled ?? true,
    profileVisibility: profile?.profile_visibility ?? "public",
    showActivity: profile?.show_activity ?? true,
    blocked: (names ?? []).map((item) => item.username || item.display_name || "Blocked account"),
  } }, { headers: { "cache-control": "private, no-store" } });
}

export async function PATCH(request: Request) {
  if (!isSupabaseConfigured()) return new Response(null, { status: 204 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid preferences" }, { status: 400 });

  const preferenceValues: Record<string, boolean | string> = { user_id: user.id, updated_at: new Date().toISOString() };
  if (parsed.data.personalizationEnabled !== undefined) preferenceValues.personalization_enabled = parsed.data.personalizationEnabled;
  if (parsed.data.playbackAnalyticsEnabled !== undefined) preferenceValues.playback_analytics_enabled = parsed.data.playbackAnalyticsEnabled;
  const operations = [];
  if (parsed.data.personalizationEnabled !== undefined || parsed.data.playbackAnalyticsEnabled !== undefined) {
    operations.push(supabase.from("user_preferences").upsert(preferenceValues));
  }
  if (parsed.data.profileVisibility !== undefined || parsed.data.showActivity !== undefined) {
    const values: Record<string, string | boolean> = { updated_at: new Date().toISOString() };
    if (parsed.data.profileVisibility !== undefined) {
      values.profile_visibility = parsed.data.profileVisibility;
      values.profile_public = parsed.data.profileVisibility === "public";
    }
    if (parsed.data.showActivity !== undefined) values.show_activity = parsed.data.showActivity;
    operations.push(supabase.from("profiles").update(values).eq("id", user.id));
  }
  if (parsed.data.clearBlocked) operations.push(supabase.from("blocked_users").delete().eq("blocker_id", user.id));
  const results = await Promise.all(operations);
  return results.some((result) => result.error)
    ? Response.json({ error: "Could not update preferences" }, { status: 500 })
    : Response.json({ updated: true });
}
