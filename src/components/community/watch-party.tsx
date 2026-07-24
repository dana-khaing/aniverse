"use client";

import { Send, Users } from "lucide-react";
import { useCallback, useState } from "react";
import { LocalPlayer } from "@/components/player/local-player";
import { type PartyEvent, usePartyTransport } from "@/lib/realtime-party";

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
  const receive = useCallback((message: PartyEvent) => {
    if (message.type !== "chat") return;
    setMessages((current) =>
      current.some((item) => item.id === message.id)
        ? current
        : [...current, message],
    );
  }, []);
  const { mode, send: sendEvent } = usePartyTransport(partyId, receive);

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
            partyController
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
        </aside>
      </section>
    </main>
  );
}
