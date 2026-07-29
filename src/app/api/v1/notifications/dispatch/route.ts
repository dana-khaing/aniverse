import { deliverNotificationEvent } from "@/lib/notification-delivery";
import {
  maxNotificationAttempts,
  notificationRetryDelay,
} from "@/lib/notification-operations";
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
  const workerId = crypto.randomUUID();
  const { data: events, error } = await admin.rpc("claim_notification_events", {
    batch_size: 50,
    worker_id: workerId,
  });
  if (error)
    return Response.json(
      { error: "Notification queue could not be read" },
      { status: 500 },
    );
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  let processed = 0;
  for (const event of events ?? []) {
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
              ? new Date(Date.now() + notificationRetryDelay(event.attempts)).toISOString()
              : new Date().toISOString(),
          locked_at: null,
          locked_by: null,
          ...(result.status === "failed" && event.attempts >= maxNotificationAttempts
            ? { status: "dead_letter" }
            : {}),
        })
        .eq("id", event.id)
        .eq("locked_by", workerId);
      processed += 1;
    } catch (error) {
      await admin
        .from("notification_events")
        .update({
          status:
            event.attempts >= maxNotificationAttempts ? "dead_letter" : "failed",
          last_error:
            error instanceof Error ? error.message : "Dispatch failed",
          available_at: new Date(
            Date.now() + notificationRetryDelay(event.attempts),
          ).toISOString(),
          locked_at: null,
          locked_by: null,
        })
        .eq("id", event.id)
        .eq("locked_by", workerId);
    }
  }
  return Response.json({ queued: events?.length ?? 0, processed });
}
