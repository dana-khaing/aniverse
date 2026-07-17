"use client";

import { useCallback, useEffect, useState } from "react";
import { initialLibraryState, useLocalDemoState } from "@/lib/local-demo";
import { normalizeLibrary, reduceLibrary, type LibraryAction, type LibrarySnapshot } from "@/lib/library";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function useLibrary() {
  const [stored, setStored] = useLocalDemoState("aniverse.library", initialLibraryState);
  const library = normalizeLibrary(stored);
  const [mode, setMode] = useState<"local" | "cloud" | "syncing">("local");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;
    async function sync() {
      setMode("syncing");
      const response = await fetch("/api/v1/library", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ library }) });
      if (cancelled || response.status === 401) { setMode("local"); return; }
      if (!response.ok) throw new Error("sync failed");
      const data = await response.json() as { library: LibrarySnapshot };
      setStored(normalizeLibrary(data.library)); setMode("cloud");
    }
    void sync().catch(() => { if (!cancelled) { setMode("local"); setMessage("Cloud sync unavailable — changes remain on this device."); } });
    return () => { cancelled = true; };
    // Sync once for the browser session; subsequent changes use actions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dispatch = useCallback(async (action: LibraryAction) => {
    setStored((current) => reduceLibrary(normalizeLibrary(current), action));
    if (mode !== "cloud") return;
    const response = await fetch("/api/v1/library", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(action) });
    if (response.ok) { const data = await response.json() as { library: LibrarySnapshot }; setStored(normalizeLibrary(data.library)); }
    else setMessage("Cloud update failed — your local change is preserved.");
  }, [mode, setStored]);

  return { library, dispatch, mode, message };
}
