"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, LoaderCircle, UserRound } from "lucide-react";
import { useLocalDemoState } from "@/lib/local-demo";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { AccountProfile } from "@/lib/account-profile";

const initialProfile: AccountProfile = { displayName: "Dana Lewis", username: "dana", bio: "Animation explorer", matureContentEnabled: false };

export function ProfileSettings() {
  const [profile, setProfile] = useLocalDemoState<AccountProfile>("aniverse.account-profile", initialProfile);
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  const cloud = isSupabaseConfigured();
  useEffect(() => { if (!cloud) return; const timer = setTimeout(() => { setBusy(true); void fetch("/api/v1/account/profile", { cache: "no-store" }).then(async (response) => response.ok ? response.json() : Promise.reject()).then((data: { profile: AccountProfile }) => setProfile(data.profile)).catch(() => setMessage("Profile settings could not be loaded.")).finally(() => setBusy(false)); }, 0); return () => clearTimeout(timer); }, [cloud, setProfile]);
  async function save(event: React.FormEvent) { event.preventDefault(); setBusy(true); setMessage(""); if (cloud) { const response = await fetch("/api/v1/account/profile", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(profile) }); const data = await response.json().catch(() => ({})) as { profile?: AccountProfile; error?: string }; if (!response.ok) { setMessage(data.error ?? "Profile settings could not be saved."); setBusy(false); return; } if (data.profile) setProfile(data.profile); } setMessage("Profile settings saved."); setBusy(false); }
  return <main className="settings-page"><nav><Link href="/account"><ArrowLeft />Back to account</Link></nav><form className="settings-card" onSubmit={(event) => void save(event)}><header><span><UserRound /></span><div><p>PROFILE & APPEARANCE</p><h1>Your public identity</h1><small>These details belong only to the signed-in account.</small></div></header><label>Display name<input required minLength={2} maxLength={80} value={profile.displayName} onChange={(event) => setProfile({ ...profile, displayName: event.target.value })} /></label><label>Username<div className="username-field"><span>@</span><input required pattern="[a-zA-Z0-9_]{3,30}" value={profile.username} onChange={(event) => setProfile({ ...profile, username: event.target.value.toLowerCase() })} /></div><small>3–30 letters, numbers, or underscores.</small></label><label>Bio<textarea maxLength={500} rows={5} value={profile.bio} onChange={(event) => setProfile({ ...profile, bio: event.target.value })} /><small>{profile.bio.length}/500</small></label><label className="settings-toggle"><span><b>Mature content</b><small>Allow age-appropriate mature titles for this account.</small></span><input type="checkbox" checked={profile.matureContentEnabled} onChange={(event) => setProfile({ ...profile, matureContentEnabled: event.target.checked })} /></label>{message && <p role="status">{message}</p>}<button disabled={busy}>{busy ? <LoaderCircle className="spin" /> : <Check />}Save profile</button></form></main>;
}
