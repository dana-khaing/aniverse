import { parseMuxEvent, verifyMuxWebhook } from "@/lib/mux";
import { getAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await request.text();
  const secret = process.env.MUX_WEBHOOK_SECRET;
  if (!secret || !verifyMuxWebhook(body, request.headers.get("mux-signature") ?? "", secret)) return Response.json({ error: "Invalid webhook signature" }, { status: 401 });
  const event = parseMuxEvent(body);
  if (!event.id || !event.type) return Response.json({ error: "Invalid event" }, { status: 400 });
  const admin = getAdminClient();
  const { error: ledgerError } = await admin.from("media_webhook_events").insert({ event_id: event.id, event_type: event.type, payload: event });
  if (ledgerError?.code === "23505") return Response.json({ received: true, duplicate: true });
  if (ledgerError) return Response.json({ error: "Webhook could not be recorded" }, { status: 500 });
  const now = new Date().toISOString();
  if (event.type === "video.upload.asset_created") {
    await admin.from("video_uploads").update({ provider_asset_id: event.data.id, status: "processing", progress: 20, updated_at: now }).eq("provider_upload_id", event.data.upload_id ?? event.data.id);
  } else if (event.type === "video.asset.ready") {
    const update = { provider_asset_id: event.data.id, playback_id: event.data.playback_ids?.find((item) => item.policy === "signed")?.id ?? event.data.playback_ids?.[0]?.id, status: "ready", progress: 100, error_message: null, updated_at: now };
    if (event.data.upload_id) await admin.from("video_uploads").update(update).eq("provider_upload_id", event.data.upload_id);
    else await admin.from("video_uploads").update(update).eq("provider_asset_id", event.data.id);
  } else if (event.type === "video.asset.errored" || event.type === "video.upload.errored") {
    const update = { status: "failed", error_message: event.data.errors?.messages?.join("; ") ?? "Mux processing failed", updated_at: now };
    if (event.data.upload_id) await admin.from("video_uploads").update(update).eq("provider_upload_id", event.data.upload_id);
    else await admin.from("video_uploads").update(update).eq("provider_asset_id", event.data.id);
  }
  return Response.json({ received: true });
}
