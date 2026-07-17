import { z } from "zod";
import { consumeRateLimit } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";
const heartbeatSchema = z.object({
  deviceName: z.string().trim().min(1).max(120),
});
const revokeSchema = z.object({ scope: z.enum(["others", "global"]) });
async function identity() {
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    { data: claimsData },
  ] = await Promise.all([supabase.auth.getUser(), supabase.auth.getClaims()]);
  const sessionId =
    typeof claimsData?.claims?.session_id === "string"
      ? claimsData.claims.session_id
      : undefined;
  return { supabase, user, sessionId };
}
export async function GET() {
  const { supabase, user, sessionId } = await identity();
  if (!user)
    return Response.json({ error: "Authentication required" }, { status: 401 });
  const { data, error } = await supabase
    .from("user_sessions")
    .select("id,auth_session_id,device_name,last_seen_at,revoked_at")
    .eq("user_id", user.id)
    .order("last_seen_at", { ascending: false })
    .limit(20);
  return error
    ? Response.json({ error: "Could not list sessions" }, { status: 500 })
    : Response.json({
        sessions: data?.map((item) => ({
          ...item,
          current: item.auth_session_id === sessionId,
        })),
      });
}
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return Response.json(
      { error: "Untrusted session origin" },
      { status: 403 },
    );
  const { supabase, user, sessionId } = await identity();
  if (!user || !sessionId)
    return Response.json(
      { error: "Verified session required" },
      { status: 401 },
    );
  if (!consumeRateLimit(`session:${user.id}`, 20, 1 / 30))
    return Response.json(
      { error: "Too many session updates" },
      { status: 429 },
    );
  const parsed = heartbeatSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return Response.json({ error: "Invalid device name" }, { status: 400 });
  const { error } = await supabase
    .from("user_sessions")
    .upsert(
      {
        id: sessionId,
        user_id: user.id,
        auth_session_id: sessionId,
        device_name: parsed.data.deviceName,
        last_seen_at: new Date().toISOString(),
        revoked_at: null,
      },
      { onConflict: "id" },
    );
  return error
    ? Response.json({ error: "Could not update session" }, { status: 500 })
    : Response.json({ currentSessionId: sessionId });
}
export async function DELETE(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return Response.json(
      { error: "Untrusted session origin" },
      { status: 403 },
    );
  const { supabase, user, sessionId } = await identity();
  if (!user)
    return Response.json({ error: "Authentication required" }, { status: 401 });
  const parsed = revokeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return Response.json({ error: "Invalid revoke scope" }, { status: 400 });
  const { error } = await supabase.auth.signOut({ scope: parsed.data.scope });
  if (error)
    return Response.json(
      { error: "Could not revoke sessions" },
      { status: 502 },
    );
  let query = supabase
    .from("user_sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("user_id", user.id);
  if (parsed.data.scope === "others" && sessionId)
    query = query.neq("auth_session_id", sessionId);
  await query;
  return Response.json({ revoked: parsed.data.scope });
}
