import { notificationReplaySchema } from "@/lib/notification-operations";
import { getAdminClient } from "@/lib/supabase/admin";
import { authorizeAdministrator } from "@/lib/supabase/authorization";

export async function GET() {
  const access = await authorizeAdministrator();
  if (!access.ok) return access.response;
  const { data, error } = await getAdminClient()
    .from("notification_events")
    .select(
      "id,user_id,recipient_email,category,title,status,attempts,available_at,processed_at,last_error,created_at,notification_deliveries(channel,status,provider_id,detail,created_at)",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  return error
    ? Response.json({ error: "Delivery history could not be loaded" }, { status: 500 })
    : Response.json(
        { events: data ?? [] },
        { headers: { "cache-control": "private, no-store" } },
      );
}

export async function PATCH(request: Request) {
  const access = await authorizeAdministrator();
  if (!access.ok) return access.response;
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return Response.json({ error: "Untrusted notification origin" }, { status: 403 });
  const parsed = notificationReplaySchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return Response.json({ error: "Invalid replay action" }, { status: 400 });
  const admin = getAdminClient();
  const { error } = await admin.rpc("replay_notification_event", {
    target_event_id: parsed.data.id,
  });
  if (error)
    return Response.json({ error: "Event is not replayable" }, { status: 409 });
  await admin.from("audit_logs").insert({
    actor_id: access.user.id,
    action: "notification.replayed",
    entity_type: "notification_event",
    entity_id: parsed.data.id,
  });
  return Response.json({ replayed: true });
}
