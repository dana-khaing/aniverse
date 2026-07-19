import { accountProfileSchema } from "@/lib/account-profile";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

async function identity() {
  if (!isSupabaseConfigured()) return { error: Response.json({ error: "Cloud profile settings are unavailable" }, { status: 503 }) };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: Response.json({ error: "Authentication required" }, { status: 401 }) };
  return { supabase, user };
}

export async function GET() {
  const access = await identity();
  if ("error" in access) return access.error;
  const { data, error } = await access.supabase.from("profiles").select("display_name,username,bio,mature_content_enabled").eq("id", access.user.id).single();
  if (error) return Response.json({ error: "Profile settings could not be loaded" }, { status: 500 });
  return Response.json({ profile: { displayName: data.display_name ?? "", username: data.username ?? "", bio: data.bio ?? "", matureContentEnabled: data.mature_content_enabled } }, { headers: { "cache-control": "private, no-store" } });
}

export async function PATCH(request: Request) {
  const access = await identity();
  if ("error" in access) return access.error;
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error: "Untrusted profile origin" }, { status: 403 });
  const parsed = accountProfileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Check your name, username, and bio" }, { status: 400 });
  const { error } = await access.supabase.from("profiles").update({ display_name: parsed.data.displayName, username: parsed.data.username, bio: parsed.data.bio, mature_content_enabled: parsed.data.matureContentEnabled, updated_at: new Date().toISOString() }).eq("id", access.user.id);
  if (error?.code === "23505") return Response.json({ error: "That username is already taken" }, { status: 409 });
  return error ? Response.json({ error: "Profile settings could not be saved" }, { status: 500 }) : Response.json({ profile: parsed.data });
}
