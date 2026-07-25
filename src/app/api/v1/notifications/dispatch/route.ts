import { deliverNotificationEvent } from "@/lib/notification-delivery";
import { getAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`)
    return Response.json(
      { error: "Invalid dispatch authorization" },
      { status: 401 },
    );
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY)
    return Response.json(
      { error: "Cloud notifications are unavailable" },
      { status: 503 },
    );
  const admin = getAdminClient();
  const { data: events, error } = await admin
    .from("notification_events")
    .select("id,user_id,category,title,body,href,attempts")
    .in("status", ["pending", "failed"])
    .lt("attempts", 10)
    .lte("available_at", new Date().toISOString())
    .order("created_at")
    .limit(50);
  if (error)
    return Response.json(
      { error: "Notification queue could not be read" },
      { status: 500 },
    );
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  let processed = 0;
  for (const event of events ?? []) {
    const { data: claimed } = await admin
      .from("notification_events")
      .update({ status: "processing", attempts: event.attempts + 1 })
      .eq("id", event.id)
      .in("status", ["pending", "failed"])
      .select("id")
      .maybeSingle();
    if (!claimed) continue;
    try {
      const result = await deliverNotificationEvent(event, origin);
      await admin
        .from("notification_events")
        .update({
          status: result.status,
          processed_at: new Date().toISOString(),
          last_error:
            result.status === "failed"
              ? result.results
                  .map((item) => item.detail)
                  .filter(Boolean)
                  .join("; ")
              : null,
          available_at:
            result.status === "failed"
              ? new Date(Date.now() + 5 * 60_000).toISOString()
              : new Date().toISOString(),
        })
        .eq("id", event.id);
      processed += 1;
    } catch (error) {
      await admin
        .from("notification_events")
        .update({
          status: "failed",
          last_error:
            error instanceof Error ? error.message : "Dispatch failed",
          available_at: new Date(Date.now() + 5 * 60_000).toISOString(),
        })
        .eq("id", event.id);
    }
  }
  return Response.json({ queued: events?.length ?? 0, processed });
}
