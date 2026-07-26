import webPush from "web-push";
import { z } from "zod";
import { getAdminClient } from "@/lib/supabase/admin";
import { authorizeStaff } from "@/lib/supabase/authorization";

const schema = z.object({
  userId: z.uuid(),
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(300),
  url: z.string().startsWith("/").default("/"),
});

export async function POST(request: Request) {
  const access = await authorizeStaff();
  if (!access.ok) return access.response;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return Response.json({ error: "Invalid notification" }, { status: 400 });
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject)
    return Response.json({ error: "VAPID is not configured" }, { status: 503 });

  webPush.setVapidDetails(subject, publicKey, privateKey);
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("push_subscriptions")
    .select("id,endpoint,p256dh,auth")
    .eq("user_id", parsed.data.userId);
  if (error)
    return Response.json(
      { error: "Subscriptions could not be loaded" },
      { status: 500 },
    );
  const payload = JSON.stringify(parsed.data);
  const results = await Promise.allSettled(
    (data ?? []).map((subscription) =>
      webPush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        },
        payload,
        { TTL: 3600, urgency: "normal" },
      ),
    ),
  );
  return Response.json({
    attempted: results.length,
    delivered: results.filter((result) => result.status === "fulfilled").length,
  });
}
