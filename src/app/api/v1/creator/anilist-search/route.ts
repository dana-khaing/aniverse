import { searchAniList } from "@/lib/anilist/client";
import { consumeDistributedRateLimit } from "@/lib/distributed-security";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

async function access() {
  if (!isSupabaseConfigured())
    return {
      error: Response.json(
        { error: "Cloud creator studio is unavailable" },
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
  const { data: membership } = await supabase
    .from("creator_team_memberships")
    .select("team_id,role")
    .eq("user_id", user.id)
    .in("role", ["owner", "editor"])
    .order("joined_at")
    .limit(1)
    .maybeSingle();
  if (!membership)
    return {
      error: Response.json(
        { error: "Creator editing permission required" },
        { status: 403 },
      ),
    };
  return { user };
}

export async function GET(request: Request) {
  const context = await access();
  if ("error" in context) return context.error;
  if (!(await consumeDistributedRateLimit("anilist-search", context.user.id)))
    return Response.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": "2", "cache-control": "private, no-store" },
      },
    );
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  try {
    const results = await searchAniList(q, 6);
    return Response.json(
      {
        results: results.map(
          ({ id, title, nativeTitle, synopsis, year, format, coverImage, siteUrl }) => ({
            id,
            title,
            nativeTitle,
            synopsis,
            year,
            format,
            coverImage,
            siteUrl,
          }),
        ),
      },
      { headers: { "cache-control": "private, no-store" } },
    );
  } catch {
    return Response.json({ error: "AniList lookup failed" }, { status: 502 });
  }
}
