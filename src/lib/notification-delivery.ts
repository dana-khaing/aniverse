import "server-only";

import webPush from "web-push";
import { sendTransactionalEmail } from "@/lib/email";
import {
  deliveryChannels,
  notificationEmailHtml,
  type DeliveryPreferences,
  type NotificationCategory,
} from "@/lib/notification-events";
import { getAdminClient } from "@/lib/supabase/admin";

type NotificationEvent = {
  id: string;
  user_id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  href: string | null;
  attempts: number;
};

async function sendPush(event: NotificationEvent) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject)
    return { status: "skipped" as const, detail: "VAPID is not configured" };
  webPush.setVapidDetails(subject, publicKey, privateKey);
  const admin = getAdminClient();
  const { data: subscriptions, error } = await admin
    .from("push_subscriptions")
    .select("id,endpoint,p256dh,auth")
    .eq("user_id", event.user_id);
  if (error) throw error;
  if (!subscriptions?.length)
    return { status: "skipped" as const, detail: "No push subscriptions" };
  let delivered = 0;
  for (const subscription of subscriptions) {
    try {
      await webPush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        },
        JSON.stringify({
          title: event.title,
          body: event.body,
          url: event.href ?? "/",
        }),
        { TTL: 3600, urgency: "normal" },
      );
      delivered += 1;
    } catch (error) {
      const statusCode =
        typeof error === "object" &&
        error &&
        "statusCode" in error &&
        typeof error.statusCode === "number"
          ? error.statusCode
          : 0;
      if ([404, 410].includes(statusCode))
        await admin
          .from("push_subscriptions")
          .delete()
          .eq("id", subscription.id);
    }
  }
  return delivered
    ? {
        status: "delivered" as const,
        detail: `${delivered}/${subscriptions.length} devices`,
      }
    : { status: "failed" as const, detail: "No device accepted the push" };
}

export async function deliverNotificationEvent(
  event: NotificationEvent,
  origin: string,
) {
  const admin = getAdminClient();
  const [{ data: preferences }, { data: authUser }] = await Promise.all([
    admin
      .from("notification_preferences")
      .select("release_email,community_email,creator_email,push_enabled")
      .eq("user_id", event.user_id)
      .single(),
    admin.auth.admin.getUserById(event.user_id),
  ]);
  const channels = deliveryChannels(
    event.category,
    (preferences ?? {
      release_email: true,
      community_email: true,
      creator_email: true,
      push_enabled: true,
    }) as DeliveryPreferences,
  );
  const results: Array<{
    channel: "email" | "push";
    status: "delivered" | "skipped" | "failed";
    provider_id?: string;
    detail?: string;
  }> = [];
  if (channels.email && authUser.user?.email) {
    try {
      const result = await sendTransactionalEmail({
        to: authUser.user.email,
        subject: event.title,
        html: notificationEmailHtml({ ...event, origin }),
        idempotencyKey: `notification-${event.id}-email`,
      });
      results.push({
        channel: "email",
        status: "delivered",
        provider_id: result.id,
        detail: result.local ? "Local provider simulation" : undefined,
      });
    } catch (error) {
      results.push({
        channel: "email",
        status: "failed",
        detail: error instanceof Error ? error.message : "Email failed",
      });
    }
  } else
    results.push({
      channel: "email",
      status: "skipped",
      detail: channels.email ? "User email unavailable" : "Preference disabled",
    });
  if (channels.push) {
    try {
      results.push({ channel: "push", ...(await sendPush(event)) });
    } catch (error) {
      results.push({
        channel: "push",
        status: "failed",
        detail: error instanceof Error ? error.message : "Push failed",
      });
    }
  } else
    results.push({
      channel: "push",
      status: "skipped",
      detail: "Preference disabled",
    });
  await admin.from("notification_deliveries").upsert(
    results.map((result) => ({ event_id: event.id, ...result })),
    { onConflict: "event_id,channel" },
  );
  const attempted = results.filter((result) => result.status !== "skipped");
  const delivered = results.filter((result) => result.status === "delivered");
  return {
    results,
    status:
      delivered.length === attempted.length
        ? ("delivered" as const)
        : delivered.length
          ? ("partial" as const)
          : ("failed" as const),
  };
}
