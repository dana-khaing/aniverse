import { signedPlaybackUrl } from "@/lib/mux";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ episodeId: string }> },
) {
  if (!process.env.MUX_SIGNING_KEY_ID || !process.env.MUX_SIGNING_PRIVATE_KEY)
    return Response.json(
      { error: "Managed playback is not configured", fallback: "local" },
      { status: 503 },
    );
  const { episodeId } = await params;
  const supabase = await createClient();
  const { data: episode } = await supabase
    .from("episodes")
    .select("id,status,available_at")
    .eq("id", episodeId)
    .single();
  if (
    !episode ||
    episode.status !== "published" ||
    new Date(episode.available_at).getTime() > Date.now()
  )
    return Response.json(
      { error: "Episode is not available" },
      { status: 404 },
    );
  const { data: upload } = await supabase
    .from("video_uploads")
    .select("playback_id")
    .eq("episode_id", episodeId)
    .eq("provider", "mux")
    .eq("status", "ready")
    .not("playback_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!upload?.playback_id)
    return Response.json(
      { error: "Video is still processing", status: "processing" },
      { status: 409 },
    );
  const { data: subtitleRows } = await supabase
    .from("subtitle_tracks")
    .select("language_code,label,storage_path,is_default")
    .eq("episode_id", episodeId)
    .order("is_default", { ascending: false });
  const { data: markerRows } = await supabase
    .from("episode_markers")
    .select("id,label,start_seconds,end_seconds,kind")
    .eq("episode_id", episodeId)
    .order("position");
  const { data: audioRows } = await supabase
    .from("episode_audio_tracks")
    .select("id,language_code,label,is_default,status")
    .eq("episode_id", episodeId)
    .eq("status", "ready")
    .order("is_default", { ascending: false });
  const subtitles = (
    await Promise.all(
      (subtitleRows ?? []).map(async (track) => {
        const { data, error } = await supabase.storage
          .from("subtitles")
          .createSignedUrl(track.storage_path, 3600);
        return error || !data?.signedUrl
          ? null
          : {
              src: data.signedUrl,
              language: track.language_code,
              label: track.label,
              default: track.is_default,
            };
      }),
    )
  ).filter((track): track is NonNullable<typeof track> => Boolean(track));
  const markers = (markerRows ?? []).map((marker) => ({
    id: marker.id,
    label: marker.label,
    start: marker.start_seconds,
    end: marker.end_seconds ?? undefined,
    kind: marker.kind,
  }));
  const audioTracks = (audioRows ?? []).map((track) => ({
    id: track.id,
    language: track.language_code,
    label: track.label,
    default: track.is_default,
  }));
  return Response.json(
    {
      url: signedPlaybackUrl(upload.playback_id),
      subtitles,
      markers,
      audioTracks,
      expiresIn: 3600,
    },
    { headers: { "cache-control": "private, no-store" } },
  );
}
