import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { profileReviewSchema } from "@/lib/public-profile";

export async function GET(_: Request, { params }: { params: Promise<{ username: string }> }) {
  if (!isSupabaseConfigured()) return Response.json({ error: "Cloud profiles are unavailable" }, { status: 503 });
  const { username } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = getAdminClient();
  const { data: profile } = await admin.from("profiles").select("id,username,display_name,bio,avatar_path,profile_public,profile_visibility,show_activity").ilike("username", username).maybeSingle();
  if (!profile) return Response.json({ error: "Profile not found" }, { status: 404 });

  const ownProfile = user?.id === profile.id;
  const visibility = profile.profile_visibility ?? (profile.profile_public ? "public" : "private");
  let follows = false;
  if (!ownProfile && visibility === "followers" && user) {
    const { count } = await admin.from("creator_follows").select("creator_id", { count: "exact", head: true }).eq("creator_id", profile.id).eq("follower_id", user.id);
    follows = Boolean(count);
  }
  if (!ownProfile && visibility !== "public" && !follows) return Response.json({ error: "Profile not found" }, { status: 404 });

  const [{ data: reviews }, { count: watched }, { count: lists }, { data: activity }] = await Promise.all([
    admin.from("profile_reviews").select("id,title_name,body,score").eq("user_id", profile.id).order("created_at", { ascending: false }),
    admin.from("watch_progress").select("episode_id", { count: "exact", head: true }).eq("user_id", profile.id).eq("completed", true),
    admin.from("custom_lists").select("id", { count: "exact", head: true }).eq("user_id", profile.id),
    profile.show_activity || ownProfile
      ? admin.from("watch_progress").select("completed,last_watched_at,episodes(number,seasons(titles(name)))").eq("user_id", profile.id).order("last_watched_at", { ascending: false }).limit(8)
      : Promise.resolve({ data: [] }),
  ]);
  return Response.json({
    profile: { username: profile.username, name: profile.display_name || profile.username, bio: profile.bio || "Animation explorer", watched: watched ?? 0 },
    reviews: (reviews ?? []).map((item) => ({ id: item.id, title: item.title_name, body: item.body, score: item.score })),
    achievements: [
      { name: "Season Pioneer", detail: `Completed ${watched ?? 0} episodes` },
      { name: "Story Curator", detail: `Created ${lists ?? 0} lists` },
      { name: "Trusted Reviewer", detail: `Published ${reviews?.length ?? 0} reviews` },
    ],
    activity: (activity ?? []).map((item) => {
      const episode = item.episodes as unknown as { number: number; seasons: { titles: { name: string } } };
      return `${item.completed ? "Completed" : "Watched"} ${episode.seasons.titles.name} episode ${episode.number}`;
    }),
  }, { headers: { "cache-control": ownProfile ? "private, no-store" : "public, max-age=60" } });
}

export async function POST(request: Request, { params }: { params: Promise<{ username: string }> }) {
  if (!isSupabaseConfigured()) return Response.json({ error: "Cloud profiles are unavailable" }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  const { username } = await params;
  const admin = getAdminClient();
  const { data: profile } = await admin.from("profiles").select("id").ilike("username", username).maybeSingle();
  if (!profile || profile.id !== user.id) return Response.json({ error: "You can only publish reviews on your own profile" }, { status: 403 });
  const parsed = profileReviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid review" }, { status: 400 });
  const { data, error } = await admin.from("profile_reviews").insert({ user_id: user.id, title_name: parsed.data.title, body: parsed.data.body, score: parsed.data.score }).select("id,title_name,body,score").single();
  return error
    ? Response.json({ error: "Review could not be published" }, { status: 500 })
    : Response.json({ review: { id: data.id, title: data.title_name, body: data.body, score: data.score } }, { status: 201 });
}
