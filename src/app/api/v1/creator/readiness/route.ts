import { z } from "zod";
import { creatorReleaseReadiness } from "@/lib/creator-readiness";
import { getAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const submitSchema = z.object({ titleId: z.uuid() });

async function context() {
  if (!isSupabaseConfigured())
    return {
      error: Response.json(
        { error: "Cloud publishing readiness is unavailable" },
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
  return { admin: getAdminClient(), membership, user };
}

async function readiness(
  access: Exclude<Awaited<ReturnType<typeof context>>, { error: Response }>,
) {
  const { data: titles, error } = await access.admin
    .from("titles")
    .select("id,name,status,seasons(episodes(id))")
    .eq("creator_team_id", access.membership.team_id)
    .order("created_at");
  if (error) throw error;
  const titleRows = titles ?? [];
  const titleIds = titleRows.map((title) => title.id);
  const episodeIds = titleRows.flatMap((title) =>
    title.seasons.flatMap((season) =>
      season.episodes.map((episode) => episode.id),
    ),
  );
  const [
    { data: assets },
    { data: translations },
    { data: videos },
    { data: audio },
  ] = await Promise.all([
    titleIds.length
      ? access.admin
          .from("title_assets")
          .select("title_id,kind")
          .in("title_id", titleIds)
      : Promise.resolve({ data: [] }),
    titleIds.length
      ? access.admin
          .from("title_translations")
          .select("title_id,locale")
          .in("title_id", titleIds)
      : Promise.resolve({ data: [] }),
    episodeIds.length
      ? access.admin
          .from("video_uploads")
          .select("episode_id")
          .in("episode_id", episodeIds)
          .eq("status", "ready")
      : Promise.resolve({ data: [] }),
    episodeIds.length
      ? access.admin
          .from("episode_audio_tracks")
          .select("episode_id")
          .in("episode_id", episodeIds)
          .eq("status", "ready")
          .eq("is_default", true)
      : Promise.resolve({ data: [] }),
  ]);
  return titleRows.map((title) => {
    const episodes = title.seasons.flatMap((season) =>
      season.episodes.map((episode) => episode.id),
    );
    return creatorReleaseReadiness({
      titleId: title.id,
      titleName: title.name,
      status: title.status,
      episodeIds: episodes,
      assetKinds: (assets ?? [])
        .filter((asset) => asset.title_id === title.id)
        .map((asset) => asset.kind as "poster" | "backdrop" | "trailer"),
      translationLocales: (translations ?? [])
        .filter((translation) => translation.title_id === title.id)
        .map((translation) => translation.locale as "en" | "ja"),
      readyVideoEpisodeIds: (videos ?? [])
        .map((video) => video.episode_id)
        .filter((id): id is string => episodes.includes(id)),
      readyAudioEpisodeIds: (audio ?? [])
        .map((track) => track.episode_id)
        .filter((id): id is string => episodes.includes(id)),
    });
  });
}

export async function GET() {
  const access = await context();
  if ("error" in access) return access.error;
  try {
    return Response.json(
      { titles: await readiness(access) },
      { headers: { "cache-control": "private, no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Publishing readiness could not be calculated" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return Response.json(
      { error: "Untrusted publishing origin" },
      { status: 403 },
    );
  const access = await context();
  if ("error" in access) return access.error;
  const parsed = submitSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return Response.json({ error: "Choose a valid title" }, { status: 400 });
  const titles = await readiness(access).catch(() => []);
  const title = titles.find((item) => item.titleId === parsed.data.titleId);
  if (!title)
    return Response.json({ error: "Title not found" }, { status: 404 });
  if (!title.canSubmit)
    return Response.json(
      { error: "Complete every media requirement before review" },
      { status: 409 },
    );
  const now = new Date().toISOString();
  const { error } = await access.admin
    .from("titles")
    .update({ status: "review", updated_at: now })
    .eq("id", title.titleId)
    .eq("creator_team_id", access.membership.team_id);
  if (error)
    return Response.json(
      { error: "Title could not be submitted for review" },
      { status: 500 },
    );
  await access.admin.from("audit_logs").insert({
    actor_id: access.user.id,
    action: "creator.title.submitted_for_review",
    entity_type: "title",
    entity_id: title.titleId,
    metadata: { readiness: title.percent },
  });
  return Response.json({
    title: { ...title, status: "review" },
    submittedAt: now,
  });
}
