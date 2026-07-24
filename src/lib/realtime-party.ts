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
export type PartyPresenceEvent = {
  id: string;
  author: string;
  body: string;
  type: "presence";
  action: "heartbeat" | "leave" | "sync-request";
  participantId: string;
  sentAt: number;
};
export type PartyEvent =
  PartyChatEvent | PartyPlaybackEvent | PartyPresenceEvent;
export type PartyConnectionState =
  "offline" | "connecting" | "connected" | "reconnecting";

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

export function activePresenceCount(
  lastSeen: Map<string, number>,
  now = Date.now(),
  timeout = 45_000,
) {
  return [...lastSeen.values()].filter((seenAt) => now - seenAt <= timeout)
    .length;
}

export function usePartyTransport(
  partyId: string | undefined,
  onEvent: (event: PartyEvent) => void,
) {
  const local = useRef<BroadcastChannel | null>(null);
  const remote = useRef<RealtimeChannel | null>(null);
  const participantId = useRef<string | null>(null);
  const localPresence = useRef(new Map<string, number>());
  const connectionRef = useRef<PartyConnectionState>(
    partyId ? "connecting" : "offline",
  );
  const [mode, setMode] = useState<"offline" | "local" | "cloud">(
    partyId ? "local" : "offline",
  );
  const [connectionState, setConnectionState] = useState<PartyConnectionState>(
    partyId ? "connecting" : "offline",
  );
  const [onlineCount, setOnlineCount] = useState(partyId ? 1 : 0);

  useEffect(() => {
    if (!partyId) return;
    const self = participantId.current ?? crypto.randomUUID();
    participantId.current = self;
    const event = (
      action: PartyPresenceEvent["action"],
    ): PartyPresenceEvent => ({
      id: crypto.randomUUID(),
      author: "Participant",
      body: action,
      type: "presence",
      action,
      participantId: self,
      sentAt: Date.now(),
    });
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      void supabase.realtime.setAuth();
      const channel = supabase
        .channel(`party:${partyId}`, {
          config: { private: true, presence: { key: self } },
        })
        .on("broadcast", { event: "party-event" }, ({ payload }) =>
          onEvent(payload as PartyEvent),
        )
        .on("presence", { event: "sync" }, () => {
          const count = Object.keys(channel.presenceState()).length;
          setOnlineCount(Math.max(1, count));
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            const recovered = connectionRef.current === "reconnecting";
            remote.current = channel;
            setMode("cloud");
            connectionRef.current = "connected";
            setConnectionState("connected");
            await channel.track({
              online_at: new Date().toISOString(),
              participant_id: self,
            });
            if (recovered) {
              await channel.send({
                type: "broadcast",
                event: "party-event",
                payload: event("sync-request"),
              });
            }
          } else if (
            ["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status)
          ) {
            remote.current = null;
            connectionRef.current = "reconnecting";
            setConnectionState("reconnecting");
          }
        });
      const visibility = () => {
        if (document.visibilityState === "visible" && remote.current)
          void remote.current.send({
            type: "broadcast",
            event: "party-event",
            payload: event("sync-request"),
          });
      };
      window.addEventListener("online", visibility);
      document.addEventListener("visibilitychange", visibility);
      return () => {
        remote.current = null;
        connectionRef.current = "offline";
        setConnectionState("offline");
        window.removeEventListener("online", visibility);
        document.removeEventListener("visibilitychange", visibility);
        void supabase.removeChannel(channel);
      };
    }
    const channel = new BroadcastChannel(`aniverse-party-${partyId}`);
    local.current = channel;
    localPresence.current.set(self, Date.now());
    connectionRef.current = "connected";
    queueMicrotask(() => setConnectionState("connected"));
    const announce = (action: PartyPresenceEvent["action"]) =>
      channel.postMessage(event(action));
    channel.onmessage = (message: MessageEvent<PartyEvent>) => {
      const payload = message.data;
      if (payload.type === "presence") {
        if (payload.action === "leave")
          localPresence.current.delete(payload.participantId);
        else localPresence.current.set(payload.participantId, payload.sentAt);
        setOnlineCount(Math.max(1, activePresenceCount(localPresence.current)));
        if (payload.action === "sync-request") announce("heartbeat");
      }
      onEvent(payload);
    };
    announce("heartbeat");
    const heartbeat = window.setInterval(() => {
      localPresence.current.set(self, Date.now());
      announce("heartbeat");
      setOnlineCount(Math.max(1, activePresenceCount(localPresence.current)));
    }, 15_000);
    const visibility = () => {
      if (document.visibilityState === "visible") announce("sync-request");
    };
    window.addEventListener("online", visibility);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      announce("leave");
      window.clearInterval(heartbeat);
      window.removeEventListener("online", visibility);
      document.removeEventListener("visibilitychange", visibility);
      local.current = null;
      channel.close();
    };
  }, [onEvent, partyId]); // connection state changes are outputs, not subscription inputs

  async function send(event: PartyEvent) {
    if (remote.current)
      await remote.current.send({
        type: "broadcast",
        event: "party-event",
        payload: event,
      });
    else local.current?.postMessage(event);
  }
  return {
    mode,
    send,
    connectionState,
    onlineCount,
  };
}
