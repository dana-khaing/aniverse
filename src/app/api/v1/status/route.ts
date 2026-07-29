import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  if (!isSupabaseConfigured())
    return Response.json({ incidents: [], mode: "local" });
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("status_incidents")
    .select("id,title,body,severity,status,affected_services,created_at,updated_at,resolved_at")
    .eq("published", true)
    .order("updated_at", { ascending: false })
    .limit(20);
  return error
    ? Response.json({ error: "Service status is unavailable" }, { status: 500 })
    : Response.json({ incidents: data ?? [], mode: "cloud" }, { headers: { "cache-control": "public, s-maxage=30, stale-while-revalidate=120" } });
}
