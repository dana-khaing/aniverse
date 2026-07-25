import { getAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

async function expire(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`)
    return Response.json(
      { error: "Invalid expiry authorization" },
      { status: 401 },
    );
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY)
    return Response.json(
      { error: "Cloud moderation is unavailable" },
      { status: 503 },
    );
  const { data, error } = await getAdminClient().rpc("expire_creator_strikes");
  if (error)
    return Response.json(
      { error: "Strike expiry transaction failed" },
      { status: 500 },
    );
  return Response.json({ expired: data ?? 0 });
}

export const GET = expire;
export const POST = expire;
