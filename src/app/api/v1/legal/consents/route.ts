import { consentSchema } from "@/lib/legal";
import { createClient } from "@/lib/supabase/server";

async function identity() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await identity();
  if (!user)
    return Response.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  const { data, error } = await supabase
    .from("consent_records")
    .select("id,consent_type,document_version,granted,source,recorded_at")
    .eq("user_id", user.id)
    .order("recorded_at", { ascending: false });
  return error
    ? Response.json({ error: "Consent history is unavailable" }, { status: 500 })
    : Response.json(
        { records: data ?? [] },
        { headers: { "cache-control": "private, no-store" } },
      );
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return Response.json({ error: "Untrusted consent origin" }, { status: 403 });
  const { supabase, user } = await identity();
  if (!user)
    return Response.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  const parsed = consentSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return Response.json({ error: "Invalid consent record" }, { status: 400 });
  if (
    ["terms", "privacy"].includes(parsed.data.type) &&
    !parsed.data.granted
  )
    return Response.json(
      { error: "Delete the account to withdraw required service terms" },
      { status: 409 },
    );
  const { data, error } = await supabase
    .from("consent_records")
    .insert({
      user_id: user.id,
      consent_type: parsed.data.type,
      document_version: parsed.data.version,
      granted: parsed.data.granted,
      source: parsed.data.source,
    })
    .select("id,consent_type,document_version,granted,source,recorded_at")
    .single();
  return error
    ? Response.json({ error: "Consent could not be recorded" }, { status: 500 })
    : Response.json({ record: data }, { status: 201 });
}
