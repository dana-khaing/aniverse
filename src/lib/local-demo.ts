"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

const DEMO_EVENT = "aniverse:demo-change";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(DEMO_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(DEMO_EVENT, onStoreChange);
  };
}

export function useLocalDemoState<T>(key: string, initialValue: T) {
  const initialJson = useMemo(() => JSON.stringify(initialValue), [initialValue]);
  const getSnapshot = useCallback(
    () => window.localStorage.getItem(key) ?? initialJson,
    [initialJson, key],
  );
  const json = useSyncExternalStore(subscribe, getSnapshot, () => initialJson);
  const value = useMemo(() => JSON.parse(json) as T, [json]);

  const setValue = useCallback(
    (next: T | ((current: T) => T)) => {
      const current = JSON.parse(
        window.localStorage.getItem(key) ?? initialJson,
      ) as T;
      const resolved = typeof next === "function"
        ? (next as (current: T) => T)(current)
        : next;
      window.localStorage.setItem(key, JSON.stringify(resolved));
      window.dispatchEvent(new Event(DEMO_EVENT));
    },
    [initialJson, key],
  );

  return [value, setValue] as const;
}

export type CreatorApplication = {
  channelName: string;
  legalName: string;
  portfolioUrl: string;
  rightsSummary: string;
  status: "draft" | "submitted" | "approved" | "rejected";
  submittedAt?: string;
};

export const emptyCreatorApplication: CreatorApplication = {
  channelName: "",
  legalName: "",
  portfolioUrl: "",
  rightsSummary: "",
  status: "draft",
};

export type CreatorWorkspace = {
  team: { name: string; members: Array<{ name: string; role: string }> };
  titles: Array<{
    id: string;
    name: string;
    status: "Draft" | "In review" | "Published";
    episodes: number;
  }>;
  uploads: Array<{
    id: string;
    assetId?: string;
    filename: string;
    title: string;
    status: "Ready" | "Processing";
    subtitles: string[];
    size?: number;
  }>;
};

export const initialCreatorWorkspace: CreatorWorkspace = {
  team: {
    name: "Lumen Works",
    members: [
      { name: "Dana Lewis", role: "Owner" },
      { name: "Mika Chen", role: "Editor" },
    ],
  },
  titles: [
    { id: "echoes", name: "Echoes of Asteria", status: "Published", episodes: 12 },
    { id: "starlight", name: "Starlight Archive", status: "Draft", episodes: 2 },
  ],
  uploads: [],
};

export type LibraryState = {
  progress: Array<{
    slug: string;
    title: string;
    episode: number;
    position: number;
    duration: number;
    watchedAt: string;
  }>;
  favorites: string[];
  lists: Array<{ id: string; name: string; titles: string[] }>;
};

export const initialLibraryState: LibraryState = {
  progress: [
    { slug: "echoes-of-asteria", title: "Echoes of Asteria", episode: 3, position: 612, duration: 1440, watchedAt: "2026-07-13T09:30:00Z" },
    { slug: "neon-ronin", title: "Neon Ronin", episode: 2, position: 1100, duration: 1440, watchedAt: "2026-07-12T21:10:00Z" },
  ],
  favorites: ["echoes-of-asteria", "paper-moons"],
  lists: [{ id: "weekend", name: "Weekend watch", titles: ["skybound"] }],
};

export type CommunityState = {
  followedCreators: string[];
  posts: Array<{ id: string; author: string; title: string; body: string; likes: number; liked: boolean; replies: string[] }>;
  notifications: Array<{ id: string; title: string; body: string; read: boolean }>;
};

export const initialCommunityState: CommunityState = {
  followedCreators: ["Lumen Works"],
  posts: [
    { id: "p1", author: "Mika", title: "Echoes of Asteria · Episode 12", body: "The cartography motif finally connecting to her lost memories was beautiful. Marking this spoiler-free, but the last frame is everything.", likes: 84, liked: false, replies: ["Same—the color script in that scene was incredible."] },
    { id: "p2", author: "Kai", title: "Neon Ronin · Episode 8", body: "That rain sequence might be Voltage Frame's best animation work yet.", likes: 51, liked: true, replies: [] },
  ],
  notifications: [
    { id: "n1", title: "New episode", body: "Echoes of Asteria episode 12 is available.", read: false },
    { id: "n2", title: "Creator update", body: "Lumen Works posted a production note.", read: false },
    { id: "n3", title: "Reply", body: "Mika replied to your comment.", read: true },
  ],
};

export type ModerationState = {
  matureContentEnabled: boolean;
  reports: Array<{ id: string; target: string; reason: string; status: "Open" | "Reviewing" | "Actioned" | "Dismissed" }>;
  appeals: Array<{ id: string; creator: string; reason: string; status: "Pending" | "Approved" | "Denied" }>;
  strikes: Array<{ creator: string; reason: string; active: boolean }>;
};

export const initialModerationState: ModerationState = {
  matureContentEnabled: false,
  reports: [
    { id: "r1", target: "Comment by NightOwl", reason: "Harassment", status: "Open" },
    { id: "r2", target: "Neon Ronin episode 8", reason: "Incorrect age rating", status: "Reviewing" },
    { id: "r3", target: "Profile: spam-universe", reason: "Spam", status: "Open" },
  ],
  appeals: [{ id: "a1", creator: "Voltage Frame", reason: "Context missing from automated claim", status: "Pending" }],
  strikes: [{ creator: "Demo Creator", reason: "Repeated unlicensed upload", active: true }],
};
