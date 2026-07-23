import {
  episodeMarkerCollectionSchema,
  markerCollectionError,
  normalizeEpisodeMarkers,
} from "@/lib/creator-markers";
import { getAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

async function creatorContext() {
  if (!isSupabaseConfigured())
    return {
      error: Response.json(
        { error: "Cloud marker authoring is unavailable" },
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

async function teamEpisodes(
  admin: ReturnType<typeof getAdminClient>,
  teamId: string,
) {
  const { data: titles, error } = await admin
    .from("titles")
    .select(
      "id,name,seasons(id,number,episodes(id,number,title,duration_seconds))",
    )
    .eq("creator_team_id", teamId)
    .order("created_at");
  if (error) return { error };
  return {
    episodes: (titles ?? []).flatMap((title) =>
      title.seasons.flatMap((season) =>
        season.episodes.map((episode) => ({
          id: episode.id,
          titleId: title.id,
          title: title.name,
          season: season.number,
          episode: episode.number,
          episodeTitle: episode.title,
          durationSeconds: episode.duration_seconds,
        })),
      ),
    ),
  };
}

export async function GET() {
  const access = await creatorContext();
  if ("error" in access) return access.error;
  const catalog = await teamEpisodes(access.admin, access.membership.team_id);
  if ("error" in catalog)
    return Response.json(
      { error: "Episode catalog could not be loaded" },
      { status: 500 },
    );
  const { data: rows, error } = catalog.episodes.length
    ? await access.admin
        .from("episode_markers")
        .select(
          "id,episode_id,label,start_seconds,end_seconds,kind,position,updated_at",
        )
        .in(
          "episode_id",
          catalog.episodes.map((episode) => episode.id),
        )
        .order("position")
    : { data: [], error: null };
  if (error)
    return Response.json(
      { error: "Episode markers could not be loaded" },
      { status: 500 },
    );
  return Response.json(
    {
      episodes: catalog.episodes,
      markers: (rows ?? []).map((marker) => ({
        id: marker.id,
        episodeId: marker.episode_id,
        label: marker.label,
        startSeconds: marker.start_seconds,
        endSeconds: marker.end_seconds,
        kind: marker.kind,
        position: marker.position,
        updatedAt: marker.updated_at,
      })),
    },
    { headers: { "cache-control": "private, no-store" } },
  );
}

export async function PUT(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return Response.json({ error: "Untrusted update origin" }, { status: 403 });
  const access = await creatorContext();
  if ("error" in access) return access.error;
  const parsed = episodeMarkerCollectionSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return Response.json(
      {
        error:
          parsed.error.issues[0]?.message ?? "Invalid episode marker timeline",
      },
      { status: 400 },
    );
  const timelineError = markerCollectionError(parsed.data.markers);
  if (timelineError)
    return Response.json({ error: timelineError }, { status: 400 });

  const catalog = await teamEpisodes(access.admin, access.membership.team_id);
  if (
    "error" in catalog ||
    !catalog.episodes.some((episode) => episode.id === parsed.data.episodeId)
  )
    return Response.json(
      { error: "Episode not found in this creator team" },
      { status: 404 },
    );
  const episode = catalog.episodes.find(
    (item) => item.id === parsed.data.episodeId,
  )!;
  if (
    episode.durationSeconds &&
    parsed.data.markers.some(
      (marker) =>
        marker.startSeconds > episode.durationSeconds ||
        (marker.endSeconds ?? 0) > episode.durationSeconds,
    )
  )
    return Response.json(
      { error: "A marker is outside the episode duration" },
      { status: 400 },
    );

  const { data: previous, error: readError } = await access.admin
    .from("episode_markers")
    .select(
      "id,episode_id,label,start_seconds,end_seconds,kind,position,created_by,created_at,updated_at",
    )
    .eq("episode_id", parsed.data.episodeId)
    .order("position");
  if (readError)
    return Response.json(
      { error: "Existing markers could not be read" },
      { status: 500 },
    );

  const { error: deleteError } = await access.admin
    .from("episode_markers")
    .delete()
    .eq("episode_id", parsed.data.episodeId);
  if (deleteError)
    return Response.json(
      { error: "Episode markers could not be updated" },
      { status: 500 },
    );

  const rows = normalizeEpisodeMarkers(parsed.data.markers).map((marker) => ({
    ...(marker.id ? { id: marker.id } : {}),
    episode_id: parsed.data.episodeId,
    label: marker.label,
    start_seconds: marker.startSeconds,
    end_seconds: marker.endSeconds ?? null,
    kind: marker.kind,
    position: marker.position,
    created_by: access.user.id,
  }));
  const result = rows.length
    ? await access.admin
        .from("episode_markers")
        .insert(rows)
        .select(
          "id,episode_id,label,start_seconds,end_seconds,kind,position,updated_at",
        )
        .order("position")
    : { data: [], error: null };
  if (result.error) {
    if (previous?.length)
      await access.admin.from("episode_markers").insert(previous);
    return Response.json(
      { error: "Episode markers could not be saved" },
      { status: 500 },
    );
  }
  return Response.json({
    markers: (result.data ?? []).map((marker) => ({
      id: marker.id,
      episodeId: marker.episode_id,
      label: marker.label,
      startSeconds: marker.start_seconds,
      endSeconds: marker.end_seconds,
      kind: marker.kind,
      position: marker.position,
      updatedAt: marker.updated_at,
    })),
  });
}
