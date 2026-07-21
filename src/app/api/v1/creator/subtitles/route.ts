import { randomUUID } from "node:crypto";
import {
  isWebVtt,
  safeSubtitleFilename,
  subtitleMetadataSchema,
} from "@/lib/creator-subtitles";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

async function context() {
  if (!isSupabaseConfigured())
    return {
      error: Response.json(
        { error: "Cloud subtitles are unavailable" },
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
  return { supabase, admin: getAdminClient(), user, membership };
}

export async function GET() {
  const access = await context();
  if ("error" in access) return access.error;
  const { data: titles } = await access.admin
    .from("titles")
    .select("id,name,seasons(id,number,episodes(id,number,title))")
    .eq("creator_team_id", access.membership.team_id)
    .order("created_at");
  const episodes = (titles ?? []).flatMap((title) =>
    title.seasons.flatMap((season) =>
      season.episodes.map((episode) => ({
        id: episode.id,
        titleId: title.id,
        title: title.name,
        season: season.number,
        episode: episode.number,
        episodeTitle: episode.title,
      })),
    ),
  );
  const { data: tracks } = episodes.length
    ? await access.admin
        .from("subtitle_tracks")
        .select(
          "id,episode_id,language_code,label,is_default,storage_path,created_at",
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
    return Response.json({ error: "Untrusted upload origin" }, { status: 403 });
  const access = await context();
  if ("error" in access) return access.error;
  const form = await request.formData().catch(() => null);
  if (!form)
    return Response.json({ error: "Invalid subtitle upload" }, { status: 400 });
  const file = form.get("file");
  const parsed = subtitleMetadataSchema.safeParse({
    episodeId: form.get("episodeId"),
    language: form.get("language"),
    label: form.get("label"),
    isDefault: form.get("isDefault") ?? "false",
  });
  if (!(file instanceof File) || !isWebVtt(file) || !parsed.success)
    return Response.json(
      {
        error: "Use a valid WebVTT file up to 5 MB with complete track details",
      },
      { status: 400 },
    );
  const header = (await file.slice(0, 64).text())
    .replace(/^\uFEFF/, "")
    .trimStart();
  if (!header.startsWith("WEBVTT"))
    return Response.json(
      { error: "The file does not contain a WebVTT header" },
      { status: 400 },
    );
  const { data: episode } = await access.admin
    .from("episodes")
    .select("id,seasons!inner(titles!inner(creator_team_id))")
    .eq("id", parsed.data.episodeId)
    .maybeSingle();
  const teamId = (
    episode?.seasons as unknown as
      { titles: { creator_team_id: string | null } } | undefined
  )?.titles.creator_team_id;
  if (!episode || teamId !== access.membership.team_id)
    return Response.json(
      { error: "Episode not found in this creator team" },
      { status: 404 },
    );
  const path = `${access.user.id}/${parsed.data.episodeId}/${randomUUID()}-${safeSubtitleFilename(file.name)}.vtt`;
  const { error: uploadError } = await access.supabase.storage
    .from("subtitles")
    .upload(path, file, { contentType: "text/vtt", upsert: false });
  if (uploadError)
    return Response.json(
      { error: "Subtitle file could not be stored" },
      { status: 500 },
    );
  if (parsed.data.isDefault)
    await access.admin
      .from("subtitle_tracks")
      .update({ is_default: false })
      .eq("episode_id", parsed.data.episodeId);
  const { data: track, error } = await access.supabase
    .from("subtitle_tracks")
    .insert({
      episode_id: parsed.data.episodeId,
      language_code: parsed.data.language,
      label: parsed.data.label,
      storage_path: path,
      is_default: parsed.data.isDefault,
      created_by: access.user.id,
    })
    .select(
      "id,episode_id,language_code,label,is_default,storage_path,created_at",
    )
    .single();
  if (error) {
    await access.supabase.storage.from("subtitles").remove([path]);
    return Response.json(
      {
        error:
          error.code === "23505"
            ? "That language already exists for this episode"
            : "Subtitle metadata could not be saved",
      },
      { status: error.code === "23505" ? 409 : 500 },
    );
  }
  return Response.json({ track }, { status: 201 });
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
    return Response.json({ error: "Invalid subtitle track" }, { status: 400 });
  const { data: track } = await access.admin
    .from("subtitle_tracks")
    .select(
      "id,storage_path,episode_id,episodes!inner(seasons!inner(titles!inner(creator_team_id)))",
    )
    .eq("id", id)
    .maybeSingle();
  const teamId = (
    track?.episodes as unknown as
      { seasons: { titles: { creator_team_id: string | null } } } | undefined
  )?.seasons.titles.creator_team_id;
  if (!track || teamId !== access.membership.team_id)
    return Response.json(
      { error: "Subtitle track not found" },
      { status: 404 },
    );
  const { error } = await access.admin
    .from("subtitle_tracks")
    .delete()
    .eq("id", id);
  if (error)
    return Response.json(
      { error: "Subtitle track could not be deleted" },
      { status: 500 },
    );
  await access.admin.storage.from("subtitles").remove([track.storage_path]);
  return new Response(null, { status: 204 });
}
