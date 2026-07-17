import { signedPlaybackUrl } from "@/lib/mux";
import { createClient } from "@/lib/supabase/server";

export async function GET(_: Request, { params }: { params: Promise<{ episodeId: string }> }) {
  if (!process.env.MUX_SIGNING_KEY_ID || !process.env.MUX_SIGNING_PRIVATE_KEY) return Response.json({ error: "Managed playback is not configured", fallback: "local" }, { status: 503 });
  const { episodeId } = await params;
  const supabase = await createClient();
  const { data: episode } = await supabase.from("episodes").select("id,status,available_at").eq("id", episodeId).single();
  if (!episode || episode.status !== "published" || new Date(episode.available_at).getTime() > Date.now()) return Response.json({ error: "Episode is not available" }, { status: 404 });
  const { data: upload } = await supabase.from("video_uploads").select("playback_id").eq("episode_id", episodeId).eq("provider", "mux").eq("status", "ready").not("playback_id", "is", null).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!upload?.playback_id) return Response.json({ error: "Video is still processing", status: "processing" }, { status: 409 });
  return Response.json({ url: signedPlaybackUrl(upload.playback_id), expiresIn: 3600 }, { headers: { "cache-control": "private, no-store" } });
}
