import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const schema = z.object({ personalizationEnabled: z.boolean().optional(), playbackAnalyticsEnabled: z.boolean().optional() }).refine((value) => Object.keys(value).length > 0);

export async function GET() {
  if (!isSupabaseConfigured()) return Response.json({ error: "Cloud preferences are unavailable" }, { status: 503 });
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  const { data } = await supabase.from("user_preferences").select("personalization_enabled,playback_analytics_enabled").eq("user_id", user.id).maybeSingle();
  return Response.json({ preferences: { personalizationEnabled: data?.personalization_enabled ?? true, playbackAnalyticsEnabled: data?.playback_analytics_enabled ?? true } }, { headers: { "cache-control": "private, no-store" } });
}

export async function PATCH(request: Request) {
  if (!isSupabaseConfigured()) return new Response(null, { status: 204 });
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid preferences" }, { status: 400 });
  const values: Record<string, boolean|string> = { user_id: user.id, updated_at: new Date().toISOString() };
  if (parsed.data.personalizationEnabled !== undefined) values.personalization_enabled = parsed.data.personalizationEnabled;
  if (parsed.data.playbackAnalyticsEnabled !== undefined) values.playback_analytics_enabled = parsed.data.playbackAnalyticsEnabled;
  const { error } = await supabase.from("user_preferences").upsert(values);
  return error ? Response.json({ error: "Could not update preferences" }, { status: 500 }) : Response.json({ updated: true });
}
