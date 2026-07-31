import { supportAdminSchema } from "@/lib/support";
import { getAdminClient } from "@/lib/supabase/admin";
import { authorizeStaff } from "@/lib/supabase/authorization";

export async function GET() {
  const access = await authorizeStaff();
  if (!access.ok) return access.response;
  const admin = getAdminClient();
  const [{ data: tickets, error }, { data: incidents }] = await Promise.all([
    admin
      .from("support_tickets")
      .select("id,user_id,category,subject,status,priority,assigned_to,created_at,updated_at,support_ticket_messages(id,author_id,body,staff_note,created_at)")
      .order("updated_at", { ascending: false })
      .limit(100),
    admin
      .from("status_incidents")
      .select("id,title,body,severity,status,affected_services,published,created_at,updated_at,resolved_at")
      .order("updated_at", { ascending: false })
      .limit(30),
  ]);
  if (error)
    return Response.json({ error: "Support queue could not be loaded" }, { status: 500 });
  const userIds = [...new Set((tickets ?? []).map((ticket) => ticket.user_id))];
  const { data: profiles } = userIds.length
    ? await admin.from("profiles").select("id,display_name,username").in("id", userIds)
    : { data: [] };
  const names = new Map((profiles ?? []).map((profile) => [profile.id, profile.display_name || profile.username || "Member"]));
  return Response.json({
    tickets: (tickets ?? []).map((ticket) => ({ ...ticket, requester: names.get(ticket.user_id) ?? "Member" })),
    incidents: incidents ?? [],
  }, { headers: { "cache-control": "private, no-store" } });
}

export async function PATCH(request: Request) {
  const access = await authorizeStaff(request);
  if (!access.ok) return access.response;
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return Response.json({ error: "Untrusted staff origin" }, { status: 403 });
  const parsed = supportAdminSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return Response.json({ error: "Invalid support action" }, { status: 400 });
  const admin = getAdminClient();
  const action = parsed.data;
  if (action.action === "reply") {
    const { error } = await admin.from("support_ticket_messages").insert({
      ticket_id: action.ticketId,
      author_id: access.user.id,
      body: action.message,
      staff_note: action.internal,
    });
    if (!error && !action.internal)
      await admin.from("support_tickets").update({
        status: "waiting_on_user",
        assigned_to: access.user.id,
        updated_at: new Date().toISOString(),
      }).eq("id", action.ticketId);
    return error
      ? Response.json({ error: "Staff reply could not be saved" }, { status: 500 })
      : Response.json({ ok: true });
  }
  if (action.action === "status") {
    const now = new Date().toISOString();
    const { error } = await admin.from("support_tickets").update({
      status: action.status,
      priority: action.priority,
      assigned_to: access.user.id,
      updated_at: now,
      resolved_at: action.status === "resolved" ? now : null,
    }).eq("id", action.ticketId);
    return error
      ? Response.json({ error: "Ticket state could not be saved" }, { status: 500 })
      : Response.json({ ok: true });
  }
  const now = new Date().toISOString();
  const payload = {
    title: action.title,
    body: action.body,
    severity: action.severity,
    status: action.status,
    affected_services: action.affectedServices,
    published: action.published,
    created_by: access.user.id,
    updated_at: now,
    resolved_at: action.status === "resolved" ? now : null,
  };
  const query = action.incidentId
    ? admin.from("status_incidents").update(payload).eq("id", action.incidentId)
    : admin.from("status_incidents").insert(payload);
  const { error } = await query;
  return error
    ? Response.json({ error: "Incident could not be published" }, { status: 500 })
    : Response.json({ ok: true });
}
