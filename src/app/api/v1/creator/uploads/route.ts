import { z } from "zod";
import { createDirectUpload } from "@/lib/mux";
import { createClient } from "@/lib/supabase/server";

const uploadRequest = z.object({ episodeId: z.string().uuid(), filename: z.string().trim().min(1).max(240), bytes: z.number().int().min(0).max(50_000_000_000).default(0) });

export async function POST(request: Request) {
  if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) return Response.json({ error: "Managed video is not configured", fallback: "local" }, { status: 503 });
  const parsed = uploadRequest.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid upload request", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  const { data: episode } = await supabase.from("episodes").select("id,seasons!inner(titles!inner(creator_team_id))").eq("id", parsed.data.episodeId).single();
  if (!episode) return Response.json({ error: "Episode not found" }, { status: 404 });
  const teamId = (episode.seasons as unknown as { titles: { creator_team_id: string | null } }).titles.creator_team_id;
  const { data: membership } = teamId ? await supabase.from("creator_team_memberships").select("role").eq("team_id", teamId).eq("user_id", user.id).in("role", ["owner", "editor", "uploader"]).maybeSingle() : { data: null };
  if (!membership) return Response.json({ error: "Creator upload permission required" }, { status: 403 });
  const { data: record, error: insertError } = await supabase.from("video_uploads").insert({ episode_id: parsed.data.episodeId, provider: "mux", filename: parsed.data.filename, bytes: parsed.data.bytes, status: "queued", created_by: user.id }).select("id").single();
  if (insertError || !record) return Response.json({ error: "Could not reserve upload" }, { status: 500 });
  try {
    const upload = await createDirectUpload({ uploadId: record.id, origin: new URL(request.url).origin });
    await supabase.from("video_uploads").update({ provider_upload_id: upload.id, status: "uploading", progress: 1, updated_at: new Date().toISOString() }).eq("id", record.id);
    return Response.json({ id: record.id, uploadUrl: upload.url, status: "uploading" }, { status: 201, headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    await supabase.from("video_uploads").update({ status: "failed", error_message: error instanceof Error ? error.message : "Mux upload failed", updated_at: new Date().toISOString() }).eq("id", record.id);
    return Response.json({ error: "Could not create managed upload" }, { status: 502 });
  }
}
