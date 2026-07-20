import { notificationSettingsSchema } from "@/lib/notification-settings";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

async function identity() {
  if (!isSupabaseConfigured()) return { error: Response.json({ error: "Cloud notification settings are unavailable" }, { status: 503 }) };
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: Response.json({ error: "Authentication required" }, { status: 401 }) };
  return { supabase, user };
}

export async function GET() {
  const access = await identity(); if ("error" in access) return access.error;
  const { data, error } = await access.supabase.from("notification_preferences").select("release_email,community_email,creator_email,in_app_enabled").eq("user_id", access.user.id).single();
  if (error) return Response.json({ error: "Notification settings could not be loaded" }, { status: 500 });
  return Response.json({ settings: { releaseEmail: data.release_email, communityEmail: data.community_email, creatorEmail: data.creator_email, inAppEnabled: data.in_app_enabled } }, { headers: { "cache-control": "private, no-store" } });
}

export async function PATCH(request: Request) {
  const access = await identity(); if ("error" in access) return access.error;
  const origin = request.headers.get("origin"); if (origin && origin !== new URL(request.url).origin) return Response.json({ error: "Untrusted settings origin" }, { status: 403 });
  const parsed = notificationSettingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid notification settings" }, { status: 400 });
  const { error } = await access.supabase.from("notification_preferences").update({ release_email: parsed.data.releaseEmail, community_email: parsed.data.communityEmail, creator_email: parsed.data.creatorEmail, in_app_enabled: parsed.data.inAppEnabled, updated_at: new Date().toISOString() }).eq("user_id", access.user.id);
  return error ? Response.json({ error: "Notification settings could not be saved" }, { status: 500 }) : Response.json({ settings: parsed.data });
}
