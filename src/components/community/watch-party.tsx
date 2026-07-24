"use client";

import { Send, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { LocalPlayer } from "@/components/player/local-player";
import {
  PartyLobbyControls,
  type PartyInvitation,
  type PartyMember,
} from "@/components/community/party-lobby-controls";
import { type PartyEvent, usePartyTransport } from "@/lib/realtime-party";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function WatchParty({ partyId }: { partyId: string }) {
  const [messages, setMessages] = useState<PartyEvent[]>([
    {
      id: "welcome",
      author: "AniVerse",
      body: "The production player is connected to party sync.",
      type: "chat",
    },
  ]);
  const [body, setBody] = useState("");
  const [role, setRole] = useState<"host" | "moderator" | "viewer">("host");
  const [status, setStatus] = useState<"scheduled" | "live" | "ended">("live");
  const [inviteCode, setInviteCode] = useState("ASTERIA12");
  const [members, setMembers] = useState<PartyMember[]>([
    { user_id: "local-host", role: "host", profiles: { display_name: "Dana" } },
    {
      user_id: "local-viewer",
      role: "viewer",
      profiles: { display_name: "Mika" },
    },
  ]);
  const [invitations, setInvitations] = useState<PartyInvitation[]>([]);
  const receive = useCallback((message: PartyEvent) => {
    if (message.type !== "chat") return;
    setMessages((current) =>
      current.some((item) => item.id === message.id)
        ? current
        : [...current, message],
    );
  }, []);
  const { mode, send: sendEvent } = usePartyTransport(partyId, receive);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const controller = new AbortController();
    void fetch(`/api/v1/parties/${encodeURIComponent(partyId)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then(
        (data: {
          role: typeof role;
          party: { status: typeof status; invite_code: string };
          members: PartyMember[];
          invitations: PartyInvitation[];
        }) => {
          setRole(data.role);
          setStatus(data.party.status);
          setInviteCode(data.party.invite_code);
          setMembers(data.members);
          setInvitations(data.invitations);
        },
      )
      .catch(() => undefined);
    return () => controller.abort();
  }, [partyId]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim()) return;
    const message: PartyEvent = {
      id: crypto.randomUUID(),
      author: "Dana",
      body: body.trim(),
      type: "chat",
    };
    setMessages((current) => [...current, message]);
    await sendEvent(message);
    setBody("");
  }

  return (
    <main className="party-page">
      <header>
        <div>
          <p>WATCH PARTY · ECHOES OF ASTERIA</p>
          <h1>Asteria finale night</h1>
          <small>
            {mode === "cloud"
              ? "Cross-device Supabase Realtime"
              : "Same-browser local mode"}
          </small>
        </div>
        <span>
          <Users />3 watching
        </span>
      </header>
      <section>
        <div className="party-production-player">
          <LocalPlayer
            slug="echoes-of-asteria"
            title="Echoes of Asteria"
            episode={12}
            totalEpisodes={12}
            partyId={partyId}
            partyController={role === "host" || role === "moderator"}
          />
        </div>
        <aside>
          <h2>Group chat</h2>
          <div>
            {messages.map((message) => (
              <p key={message.id}>
                <b>{message.author}</b>
                {message.body}
              </p>
            ))}
          </div>
          <form onSubmit={send}>
            <input
              aria-label="Party message"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Message the party"
            />
            <button aria-label="Send">
              <Send />
            </button>
          </form>
          <PartyLobbyControls
            partyId={partyId}
            inviteCode={inviteCode}
            role={role}
            status={status}
            members={members}
            invitations={invitations}
            onStatus={setStatus}
          />
        </aside>
      </section>
    </main>
  );
}
