import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { profileBlockSchema, profileFollowSchema, profileReportSchema, profileReviewSchema } from "@/lib/public-profile";
import { consumeRateLimit } from "@/lib/security";

export async function GET(_: Request, { params }: { params: Promise<{ username: string }> }) {
  if (!isSupabaseConfigured()) return Response.json({ error: "Cloud profiles are unavailable" }, { status: 503 });
  const { username } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = getAdminClient();
  const { data: profile } = await admin.from("profiles").select("id,username,display_name,bio,avatar_path,profile_public,profile_visibility,show_activity").ilike("username", username).maybeSingle();
  if (!profile) return Response.json({ error: "Profile not found" }, { status: 404 });

  const ownProfile = user?.id === profile.id;
  const { data: blockRows } = user && !ownProfile ? await admin.from("blocked_users").select("blocker_id,blocked_id").or(`and(blocker_id.eq.${user.id},blocked_id.eq.${profile.id}),and(blocker_id.eq.${profile.id},blocked_id.eq.${user.id})`) : { data: [] };
  const viewerBlocked = Boolean(blockRows?.some((item) => item.blocker_id === user?.id));
  const blockedByProfile = Boolean(blockRows?.some((item) => item.blocker_id === profile.id));
  if (blockedByProfile) return Response.json({ error: "Profile not found" }, { status: 404 });
  const visibility = profile.profile_visibility ?? (profile.profile_public ? "public" : "private");
  let follows = false;
  if (!ownProfile && visibility === "followers" && user) {
    const { count } = await admin.from("creator_follows").select("creator_id", { count: "exact", head: true }).eq("creator_id", profile.id).eq("follower_id", user.id);
    follows = Boolean(count);
  }
  if (!ownProfile && visibility !== "public" && !follows) return Response.json({ error: "Profile not found" }, { status: 404 });

  const [{ data: reviews }, { count: watched }, { count: lists }, { data: activity }, { count: followers }, { data: viewerFollow }] = await Promise.all([
    admin.from("profile_reviews").select("id,title_name,body,score").eq("user_id", profile.id).order("created_at", { ascending: false }),
    admin.from("watch_progress").select("episode_id", { count: "exact", head: true }).eq("user_id", profile.id).eq("completed", true),
    admin.from("custom_lists").select("id", { count: "exact", head: true }).eq("user_id", profile.id),
    profile.show_activity || ownProfile
      ? admin.from("watch_progress").select("completed,last_watched_at,episodes(number,seasons(titles(name)))").eq("user_id", profile.id).order("last_watched_at", { ascending: false }).limit(8)
      : Promise.resolve({ data: [] }),
    admin.from("creator_follows").select("follower_id", { count: "exact", head: true }).eq("creator_id", profile.id),
    user && !ownProfile ? admin.from("creator_follows").select("creator_id").eq("creator_id", profile.id).eq("follower_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  return Response.json({
    profile: { username: profile.username, name: profile.display_name || profile.username, bio: profile.bio || "Animation explorer", watched: watched ?? 0, followers: followers ?? 0, followed: Boolean(viewerFollow), blocked: viewerBlocked, ownProfile, authenticated: Boolean(user) },
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

export async function PATCH(request: Request, { params }: { params: Promise<{ username: string }> }) {
  if (!isSupabaseConfigured()) return Response.json({ error: "Cloud profiles are unavailable" }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Sign in to follow profiles" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const follow = profileFollowSchema.safeParse(body);
  const block = profileBlockSchema.safeParse(body);
  if (!follow.success && !block.success) return Response.json({ error: "Invalid profile action" }, { status: 400 });
  const { username } = await params;
  const admin = getAdminClient();
  const { data: profile } = await admin.from("profiles").select("id,display_name,username").ilike("username", username).maybeSingle();
  if (!profile) return Response.json({ error: "Profile not found" }, { status: 404 });
  if (profile.id === user.id) return Response.json({ error: "You cannot change your own relationship" }, { status: 409 });
  if (block.success) {
    const { error } = block.data.blocked
      ? await admin.from("blocked_users").upsert({ blocker_id: user.id, blocked_id: profile.id })
      : await admin.from("blocked_users").delete().eq("blocker_id", user.id).eq("blocked_id", profile.id);
    if (!error && block.data.blocked) await Promise.all([
      admin.from("creator_follows").delete().eq("follower_id", user.id).eq("creator_id", profile.id),
      admin.from("creator_follows").delete().eq("follower_id", profile.id).eq("creator_id", user.id),
    ]);
    return error ? Response.json({ error: "Block could not be saved" }, { status: 500 }) : Response.json({ blocked: block.data.blocked });
  }
  if (!follow.success) return Response.json({ error: "Invalid follow action" }, { status: 400 });
  const { count: blocked } = await admin.from("blocked_users").select("blocker_id", { count: "exact", head: true }).or(`and(blocker_id.eq.${user.id},blocked_id.eq.${profile.id}),and(blocker_id.eq.${profile.id},blocked_id.eq.${user.id})`);
  if (blocked) return Response.json({ error: "This follow is unavailable" }, { status: 403 });
  const query = admin.from("creator_follows");
  const { error } = follow.data.followed
    ? await query.upsert({ follower_id: user.id, creator_id: profile.id })
    : await query.delete().eq("follower_id", user.id).eq("creator_id", profile.id);
  if (error) return Response.json({ error: "Follow could not be saved" }, { status: 500 });
  if (follow.data.followed) {
    const { data: viewer } = await admin.from("profiles").select("display_name,username").eq("id", user.id).maybeSingle();
    await admin.from("notifications").insert({ user_id: profile.id, type: "follow", title: "New follower", body: `${viewer?.display_name || viewer?.username || "An AniVerse member"} followed your profile.`, href: `/profile/${viewer?.username ?? ""}` });
  }
  return Response.json({ followed: follow.data.followed });
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

export async function PUT(request: Request, { params }: { params: Promise<{ username: string }> }) {
  if (!isSupabaseConfigured()) return Response.json({ error: "Cloud reporting is unavailable" }, { status: 503 });
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error: "Untrusted report origin" }, { status: 403 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Sign in to report profiles" }, { status: 401 });
  if (!consumeRateLimit(`profile-report:${user.id}`, 5, 1 / 300)) return Response.json({ error: "Too many reports. Try again later." }, { status: 429 });
  const parsed = profileReportSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Choose a reason and add at least 10 characters of detail" }, { status: 400 });
  const { username } = await params;
  const admin = getAdminClient();
  const { data: profile } = await admin.from("profiles").select("id").ilike("username", username).maybeSingle();
  if (!profile) return Response.json({ error: "Profile not found" }, { status: 404 });
  if (profile.id === user.id) return Response.json({ error: "You cannot report your own profile" }, { status: 409 });
  const { data: existing } = await admin.from("reports").select("id").eq("reporter_id", user.id).eq("entity_type", "profile").eq("entity_id", profile.id).in("status", ["open", "reviewing"]).maybeSingle();
  if (existing) return Response.json({ error: "You already have an active report for this profile" }, { status: 409 });
  const { data, error } = await admin.from("reports").insert({ reporter_id: user.id, entity_type: "profile", entity_id: profile.id, reason: parsed.data.reason, details: parsed.data.details }).select("id,status").single();
  return error ? Response.json({ error: "Report could not be submitted" }, { status: 500 }) : Response.json({ report: data }, { status: 201 });
}
