"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Check, LoaderCircle } from "lucide-react";
import { useLocalDemoState } from "@/lib/local-demo";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { NotificationSettings as Settings } from "@/lib/notification-settings";

const initial: Settings = { releaseEmail: true, communityEmail: true, creatorEmail: true, inAppEnabled: true };
const channels: Array<{ key: keyof Settings; title: string; detail: string }> = [
  { key: "releaseEmail", title: "Release emails", detail: "New episodes, premieres, and schedule changes." },
  { key: "communityEmail", title: "Community emails", detail: "Replies, reactions, follows, and moderation updates." },
  { key: "creatorEmail", title: "Creator emails", detail: "Publishing, team invitations, uploads, and payouts." },
  { key: "inAppEnabled", title: "In-app notifications", detail: "Show activity in AniVerse while signed in." },
];

export function NotificationSettings() {
  const [settings, setSettings] = useLocalDemoState<Settings>("aniverse.notification-settings", initial);
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const cloud = isSupabaseConfigured();
  useEffect(() => { if (!cloud) return; const timer = setTimeout(() => { setBusy(true); void fetch("/api/v1/account/notifications", { cache: "no-store" }).then(async (response) => response.ok ? response.json() : Promise.reject()).then((data: { settings: Settings }) => setSettings(data.settings)).catch(() => setMessage("Notification settings could not be loaded.")).finally(() => setBusy(false)); }, 0); return () => clearTimeout(timer); }, [cloud, setSettings]);
  async function save(event: React.FormEvent) { event.preventDefault(); setBusy(true); setMessage(""); if (cloud) { const response = await fetch("/api/v1/account/notifications", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(settings) }); const data = await response.json().catch(() => ({})) as { error?: string }; if (!response.ok) { setMessage(data.error ?? "Notification settings could not be saved."); setBusy(false); return; } } setMessage("Notification settings saved."); setBusy(false); }
  return <main className="settings-page"><nav><Link href="/account"><ArrowLeft />Back to account</Link></nav><form className="settings-card" onSubmit={(event) => void save(event)}><header><span><Bell /></span><div><p>NOTIFICATIONS</p><h1>Choose what reaches you</h1><small>Preferences are private and scoped to this signed-in account.</small></div></header><div className="settings-options">{channels.map((channel) => <label className="settings-toggle" key={channel.key}><span><b>{channel.title}</b><small>{channel.detail}</small></span><input type="checkbox" checked={settings[channel.key]} onChange={(event) => setSettings({ ...settings, [channel.key]: event.target.checked })} /></label>)}</div>{message && <p role="status">{message}</p>}<button disabled={busy}>{busy ? <LoaderCircle className="spin" /> : <Check />}Save notifications</button></form></main>;
}
