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
    filename: string;
    title: string;
    status: "Ready" | "Processing";
    subtitles: string[];
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
