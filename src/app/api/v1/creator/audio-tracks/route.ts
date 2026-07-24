import { audioTrackSchema } from "@/lib/creator-audio";
import { createAudioTrack, deleteAudioTrack } from "@/lib/mux";
import { getAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

async function context() {
  if (!isSupabaseConfigured())
    return {
      error: Response.json(
        { error: "Cloud audio is unavailable" },
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
    .in("role", ["owner", "editor", "uploader"])
    .order("joined_at")
    .limit(1)
    .maybeSingle();
  if (!membership)
    return {
      error: Response.json(
        { error: "Creator upload permission required" },
        { status: 403 },
      ),
    };
  return { admin: getAdminClient(), user, membership };
}

async function creatorEpisodes(
  access: Exclude<Awaited<ReturnType<typeof context>>, { error: Response }>,
) {
  const { data: titles } = await access.admin
    .from("titles")
    .select("id,name,seasons(id,number,episodes(id,number,title))")
    .eq("creator_team_id", access.membership.team_id)
    .order("created_at");
  return (titles ?? []).flatMap((title) =>
    title.seasons.flatMap((season) =>
      season.episodes.map((episode) => ({
        id: episode.id,
        title: title.name,
        season: season.number,
        episode: episode.number,
        episodeTitle: episode.title,
      })),
    ),
  );
}

export async function GET() {
  const access = await context();
  if ("error" in access) return access.error;
  const episodes = await creatorEpisodes(access);
  const { data: tracks } = episodes.length
    ? await access.admin
        .from("episode_audio_tracks")
        .select(
          "id,episode_id,language_code,label,is_default,status,error_message,created_at",
        )
        .in(
          "episode_id",
          episodes.map((episode) => episode.id),
        )
        .order("created_at", { ascending: false })
    : { data: [] };
  return Response.json(
    { episodes, tracks: tracks ?? [] },
    { headers: { "cache-control": "private, no-store" } },
  );
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return Response.json({ error: "Untrusted audio origin" }, { status: 403 });
  const access = await context();
  if ("error" in access) return access.error;
  const parsed = audioTrackSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return Response.json(
      { error: "Complete the audio language, label, and secure source URL" },
      { status: 400 },
    );
  const episodes = await creatorEpisodes(access);
  if (!episodes.some((episode) => episode.id === parsed.data.episodeId))
    return Response.json(
      { error: "Episode not found in this creator team" },
      { status: 404 },
    );
  const { data: upload } = await access.admin
    .from("video_uploads")
    .select("id,provider_asset_id")
    .eq("episode_id", parsed.data.episodeId)
    .eq("provider", "mux")
    .eq("status", "ready")
    .not("provider_asset_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!upload?.provider_asset_id)
    return Response.json(
      { error: "A ready Mux video is required before adding audio" },
      { status: 409 },
    );
  try {
    const providerTrack = await createAudioTrack(upload.provider_asset_id, {
      url: parsed.data.sourceUrl,
      languageCode: parsed.data.languageCode,
      name: parsed.data.label,
    });
    if (parsed.data.isDefault)
      await access.admin
        .from("episode_audio_tracks")
        .update({ is_default: false })
        .eq("episode_id", parsed.data.episodeId);
    const { data: track, error } = await access.admin
      .from("episode_audio_tracks")
      .insert({
        episode_id: parsed.data.episodeId,
        video_upload_id: upload.id,
        provider_track_id: providerTrack.id,
        language_code: parsed.data.languageCode,
        label: parsed.data.label,
        source_url: parsed.data.sourceUrl,
        is_default: parsed.data.isDefault,
        status: providerTrack.status === "ready" ? "ready" : "preparing",
        created_by: access.user.id,
      })
      .select(
        "id,episode_id,language_code,label,is_default,status,error_message,created_at",
      )
      .single();
    if (error) {
      await deleteAudioTrack(upload.provider_asset_id, providerTrack.id);
      return Response.json(
        {
          error:
            error.code === "23505"
              ? "That audio language already exists"
              : "Audio metadata could not be saved",
        },
        { status: error.code === "23505" ? 409 : 500 },
      );
    }
    return Response.json({ track }, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Mux could not add the audio track",
      },
      { status: 502 },
    );
  }
}

export async function DELETE(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return Response.json(
      { error: "Untrusted deletion origin" },
      { status: 403 },
    );
  const access = await context();
  if ("error" in access) return access.error;
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id))
    return Response.json({ error: "Invalid audio track" }, { status: 400 });
  const { data: track } = await access.admin
    .from("episode_audio_tracks")
    .select(
      "id,episode_id,provider_track_id,video_uploads!inner(provider_asset_id),episodes!inner(seasons!inner(titles!inner(creator_team_id)))",
    )
    .eq("id", id)
    .maybeSingle();
  const teamId = (
    track?.episodes as unknown as
      { seasons: { titles: { creator_team_id: string | null } } } | undefined
  )?.seasons.titles.creator_team_id;
  const assetId = (
    track?.video_uploads as unknown as
      { provider_asset_id: string | null } | undefined
  )?.provider_asset_id;
  if (!track || teamId !== access.membership.team_id)
    return Response.json({ error: "Audio track not found" }, { status: 404 });
  if (assetId && track.provider_track_id)
    await deleteAudioTrack(assetId, track.provider_track_id);
  const { error } = await access.admin
    .from("episode_audio_tracks")
    .delete()
    .eq("id", id);
  if (error)
    return Response.json(
      { error: "Audio track could not be deleted" },
      { status: 500 },
    );
  return new Response(null, { status: 204 });
}
