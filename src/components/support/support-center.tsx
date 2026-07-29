"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { LoaderCircle, MessageSquare, Send } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type Ticket = {
  id: string;
  category: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  support_ticket_messages: Array<{ id: number; author_id: string | null; body: string; created_at: string }>;
};

export function SupportCenter() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const cloud = isSupabaseConfigured();
  const load = useCallback(async () => {
    if (!cloud) return;
    const response = await fetch("/api/v1/support/tickets", { cache: "no-store" });
    const data = await response.json().catch(() => ({})) as { tickets?: Ticket[]; error?: string };
    if (response.ok) setTickets(data.tickets ?? []);
    else setMessage(data.error ?? "Support history could not be loaded.");
  }, [cloud]);
  useEffect(() => { const timer = setTimeout(() => void load(), 0); return () => clearTimeout(timer); }, [load]);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/v1/support/tickets", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ category: form.get("category"), subject: form.get("subject"), message: form.get("message") }),
    });
    const data = await response.json().catch(() => ({})) as { error?: string };
    if (response.ok) { event.currentTarget.reset(); setMessage("Support request created."); await load(); }
    else setMessage(data.error ?? "Support request could not be created.");
    setBusy(false);
  }
  async function reply(ticketId: string, body: string) {
    if (!body.trim()) return; setBusy(true);
    const response = await fetch("/api/v1/support/tickets", {
      method: "PATCH", headers: { "content-type": "application/json" },
      body: JSON.stringify({ ticketId, message: body }),
    });
    setMessage(response.ok ? "Reply sent." : "Reply could not be sent.");
    if (response.ok) await load(); setBusy(false);
  }
  return <div className="support-center">
    <form className="support-form" onSubmit={create}>
      <header><MessageSquare/><div><p>CONTACT SUPPORT</p><h2>How can we help?</h2></div></header>
      {!cloud && <p className="support-setup">Connect AniVerse to Supabase and sign in to create tracked support requests.</p>}
      <div><label>Topic<select required name="category"><option value="account">Account</option><option value="playback">Playback</option><option value="creator">Creator</option><option value="billing">Billing</option><option value="safety">Safety</option><option value="other">Other</option></select></label><label>Subject<input required name="subject" minLength={5} maxLength={160}/></label></div>
      <label>What happened?<textarea required name="message" minLength={10} maxLength={5000} rows={6}/></label>
      <button disabled={busy || !cloud}>{busy ? <LoaderCircle className="spin"/> : <Send/>}Create support request</button>
      {message && <p role="status">{message}</p>}
    </form>
    <section className="ticket-history"><h2>Your requests</h2>{tickets.length ? tickets.map(ticket => <article key={ticket.id}><header><div><b>{ticket.subject}</b><span>{ticket.category} · {new Date(ticket.created_at).toLocaleString()}</span></div><i>{ticket.status.replaceAll("_", " ")}</i></header><div>{ticket.support_ticket_messages.map(item => <p key={item.id}>{item.body}<time>{new Date(item.created_at).toLocaleString()}</time></p>)}</div>{!["resolved","closed"].includes(ticket.status) && <form onSubmit={event => { event.preventDefault(); const input = new FormData(event.currentTarget); void reply(ticket.id, String(input.get("message"))); event.currentTarget.reset(); }}><input required name="message" aria-label={`Reply to ${ticket.subject}`} placeholder="Add a reply"/><button disabled={busy}><Send/></button></form>}</article>) : <p>No support requests yet.</p>}</section>
  </div>;
}
