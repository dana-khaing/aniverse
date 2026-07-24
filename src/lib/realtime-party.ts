"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type PartyChatEvent = {
  id: string;
  author: string;
  body: string;
  type: "chat";
};

export type PartyPlaybackEvent = {
  id: string;
  author: string;
  body: string;
  type: "playback";
  action: "play" | "pause" | "seek";
  position: number;
  playbackRate: number;
  sentAt: number;
  sequence: number;
};

export type PartyEvent = PartyChatEvent | PartyPlaybackEvent;

export function synchronizedPosition(
  event: PartyPlaybackEvent,
  now = Date.now(),
) {
  if (event.action !== "play") return event.position;
  return (
    event.position +
    (Math.max(0, now - event.sentAt) / 1000) * event.playbackRate
  );
}

export function usePartyTransport(
  partyId: string | undefined,
  onEvent: (event: PartyEvent) => void,
) {
  const local = useRef<BroadcastChannel | null>(null);
  const remote = useRef<RealtimeChannel | null>(null);
  const [mode, setMode] = useState<"offline" | "local" | "cloud">(
    partyId ? "local" : "offline",
  );

  useEffect(() => {
    if (!partyId) return;
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      void supabase.realtime.setAuth();
      const channel = supabase
        .channel(`party:${partyId}`, {
          config: { private: true, presence: { key: crypto.randomUUID() } },
        })
        .on("broadcast", { event: "party-event" }, ({ payload }) =>
          onEvent(payload as PartyEvent),
        )
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            remote.current = channel;
            setMode("cloud");
            await channel.track({ online_at: new Date().toISOString() });
          }
        });
      return () => {
        remote.current = null;
        void supabase.removeChannel(channel);
      };
    }
    const channel = new BroadcastChannel(`aniverse-party-${partyId}`);
    local.current = channel;
    channel.onmessage = (event: MessageEvent<PartyEvent>) =>
      onEvent(event.data);
    return () => {
      local.current = null;
      channel.close();
    };
  }, [onEvent, partyId]);

  async function send(event: PartyEvent) {
    if (remote.current)
      await remote.current.send({
        type: "broadcast",
        event: "party-event",
        payload: event,
      });
    else local.current?.postMessage(event);
  }

  return { mode, send };
}
