"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, KeyRound, LoaderCircle, LogOut, MonitorSmartphone, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type Session = { id: string; device_name: string; last_seen_at: string; current: boolean; revoked_at: string | null };

export function SecuritySettings() {
  const cloud = isSupabaseConfigured();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!cloud) return;
    const timer = setTimeout(() => {
      void fetch("/api/v1/account/sessions", { cache: "no-store" })
        .then(async (response) => response.ok ? response.json() : Promise.reject())
        .then((data: { sessions: Session[] }) => setSessions(data.sessions.filter((item) => !item.revoked_at)))
        .catch(() => setMessage("Active sessions could not be loaded."));
    }, 0);
    return () => clearTimeout(timer);
  }, [cloud]);

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cloud) { setMessage("Connect Supabase Auth to change your password."); return; }
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmation = String(form.get("confirmation") ?? "");
    if (password.length < 8) { setMessage("Use at least 8 characters for your new password."); return; }
    if (password !== confirmation) { setMessage("The new passwords do not match."); return; }
    setBusy("password"); setMessage("");
    const { error } = await createClient().auth.updateUser({ password });
    setMessage(error?.message ?? "Password updated securely.");
    if (!error) event.currentTarget.reset();
    setBusy("");
  }

  async function revoke(scope: "others" | "global") {
    if (!cloud) { setMessage("This browser is the only active local session."); return; }
    setBusy(scope); setMessage("");
    const response = await fetch("/api/v1/account/sessions", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ scope }) });
    if (!response.ok) { setMessage("Sessions could not be signed out."); setBusy(""); return; }
    if (scope === "global") { window.location.assign("/sign-in"); return; }
    setSessions((current) => current.filter((item) => item.current));
    setMessage("All other devices have been signed out."); setBusy("");
  }

  async function signOutHere() {
    if (!cloud) { window.location.assign("/"); return; }
    setBusy("local");
    await createClient().auth.signOut({ scope: "local" });
    window.location.assign("/sign-in");
  }

  return <main className="settings-page"><nav><Link href="/account"><ArrowLeft />Back to account</Link></nav><div className="security-stack"><section className="settings-card"><header><span><ShieldCheck /></span><div><p>SECURITY</p><h1>Password & sessions</h1><small>Protect this account and control where it is signed in.</small></div></header><form className="password-form" onSubmit={(event) => void changePassword(event)}><label>New password<input name="password" type="password" minLength={8} autoComplete="new-password" required /></label><label>Confirm new password<input name="confirmation" type="password" minLength={8} autoComplete="new-password" required /></label><button disabled={Boolean(busy)}>{busy === "password" ? <LoaderCircle className="spin" /> : <KeyRound />}Update password</button></form></section><section className="settings-card session-settings"><header><span><MonitorSmartphone /></span><div><p>ACTIVE SESSIONS</p><h2>Your signed-in devices</h2><small>Session records are private to this account.</small></div></header><div className="security-sessions">{cloud ? sessions.map((session) => <article key={session.id}><div><b>{session.device_name}</b><small>{session.current ? "Current session · " : ""}{new Date(session.last_seen_at).toLocaleString()}</small></div>{session.current && <i>Current</i>}</article>) : <article><div><b>This browser</b><small>Local mode · Active now</small></div><i>Current</i></article>}</div><div className="security-actions"><button disabled={Boolean(busy) || !sessions.some((item) => !item.current)} onClick={() => void revoke("others")}><LogOut />Sign out other devices</button><button disabled={Boolean(busy)} onClick={() => void signOutHere()}><LogOut />Sign out here</button><button className="danger" disabled={Boolean(busy)} onClick={() => void revoke("global")}><ShieldCheck />Sign out everywhere</button></div>{message && <p role="status">{message}</p>}</section></div></main>;
}
