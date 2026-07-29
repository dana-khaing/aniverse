import { supportReplySchema, supportTicketSchema } from "@/lib/support";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

async function identity() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? { supabase, user } : null;
}

export async function GET() {
  const access = await identity();
  if (!access)
    return Response.json({ error: "Authentication required" }, { status: 401 });
  const { data, error } = await access.supabase
    .from("support_tickets")
    .select("id,category,subject,status,priority,created_at,updated_at,resolved_at,support_ticket_messages(id,author_id,body,created_at)")
    .eq("user_id", access.user.id)
    .order("updated_at", { ascending: false });
  return error
    ? Response.json({ error: "Support history could not be loaded" }, { status: 500 })
    : Response.json({ tickets: data ?? [] }, { headers: { "cache-control": "private, no-store" } });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return Response.json({ error: "Untrusted support origin" }, { status: 403 });
  const access = await identity();
  if (!access)
    return Response.json({ error: "Authentication required" }, { status: 401 });
  const parsed = supportTicketSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return Response.json({ error: "Complete the support request" }, { status: 400 });
  const { data: ticket, error } = await access.supabase
    .from("support_tickets")
    .insert({
      user_id: access.user.id,
      category: parsed.data.category,
      subject: parsed.data.subject,
    })
    .select("id,category,subject,status,priority,created_at,updated_at")
    .single();
  if (error || !ticket)
    return Response.json({ error: "Support request could not be created" }, { status: 500 });
  const { error: messageError } = await access.supabase
    .from("support_ticket_messages")
    .insert({ ticket_id: ticket.id, author_id: access.user.id, body: parsed.data.message });
  if (messageError)
    return Response.json({ error: "Support message could not be recorded" }, { status: 500 });
  return Response.json({ ticket }, { status: 201 });
}

export async function PATCH(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return Response.json({ error: "Untrusted support origin" }, { status: 403 });
  const access = await identity();
  if (!access)
    return Response.json({ error: "Authentication required" }, { status: 401 });
  const parsed = supportReplySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return Response.json({ error: "Invalid support reply" }, { status: 400 });
  const { data: ticket } = await access.supabase
    .from("support_tickets")
    .select("id,status")
    .eq("id", parsed.data.ticketId)
    .eq("user_id", access.user.id)
    .maybeSingle();
  if (!ticket || ["resolved", "closed"].includes(ticket.status))
    return Response.json({ error: "This support request cannot receive replies" }, { status: 409 });
  const { data, error } = await access.supabase
    .from("support_ticket_messages")
    .insert({ ticket_id: ticket.id, author_id: access.user.id, body: parsed.data.message })
    .select("id,author_id,body,created_at")
    .single();
  return error
    ? Response.json({ error: "Support reply could not be sent" }, { status: 500 })
    : Response.json({ message: data }, { status: 201 });
}
