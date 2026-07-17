"use client";
import { useCallback, useEffect, useState } from "react";
import {
  Cloud,
  CloudDownload,
  CloudUpload,
  LoaderCircle,
  LogOut,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { exportLocalData, importLocalData } from "@/lib/local-data/database";
type Backup = { id: string; byte_size: number; created_at: string };
type Session = {
  id: string;
  device_name: string;
  last_seen_at: string;
  revoked_at?: string;
  current: boolean;
};
function deviceName() {
  const platform = navigator.platform || "Device";
  const browser = navigator.userAgent.includes("Firefox")
    ? "Firefox"
    : navigator.userAgent.includes("Edg/")
      ? "Edge"
      : navigator.userAgent.includes("Chrome")
        ? "Chrome"
        : navigator.userAgent.includes("Safari")
          ? "Safari"
          : "Browser";
  return `${browser} on ${platform}`;
}
export function CloudContinuity() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [busy, setBusy] = useState<string>();
  const [message, setMessage] = useState("");
  const refresh = useCallback(async () => {
    const [backupResponse, sessionResponse] = await Promise.all([
      fetch("/api/v1/account/backups", { cache: "no-store" }),
      fetch("/api/v1/account/sessions", { cache: "no-store" }),
    ]);
    if (backupResponse.ok)
      setBackups(
        ((await backupResponse.json()) as { backups: Backup[] }).backups,
      );
    if (sessionResponse.ok)
      setSessions(
        ((await sessionResponse.json()) as { sessions: Session[] }).sessions,
      );
  }, []);
  useEffect(() => {
    void fetch("/api/v1/account/sessions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ deviceName: deviceName() }),
    }).then(() => refresh());
  }, [refresh]);
  async function createBackup() {
    setBusy("backup");
    const indexed = await exportLocalData();
    const payload = {
      ...indexed,
      localStorage: Object.fromEntries(
        Object.keys(localStorage)
          .filter((key) => key.startsWith("aniverse."))
          .map((key) => [key, localStorage.getItem(key)]),
      ),
    };
    const response = await fetch("/api/v1/account/backups", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ payload }),
    });
    setMessage(
      response.ok
        ? "Encrypted cloud backup created."
        : ((await response.json()) as { error: string }).error,
    );
    await refresh();
    setBusy(undefined);
  }
  async function restore(id: string) {
    setBusy(id);
    const response = await fetch(`/api/v1/account/backups?id=${id}`, {
      cache: "no-store",
    });
    if (response.ok) {
      const { payload } = (await response.json()) as {
        payload: Awaited<ReturnType<typeof exportLocalData>> & {
          localStorage?: Record<string, string>;
        };
      };
      await importLocalData(payload);
      for (const [key, value] of Object.entries(payload.localStorage ?? {}))
        if (typeof value === "string") localStorage.setItem(key, value);
      setMessage("Cloud backup restored. Reload to apply every change.");
    } else setMessage("Backup could not be restored.");
    setBusy(undefined);
  }
  async function revokeOthers() {
    setBusy("sessions");
    const response = await fetch("/api/v1/account/sessions", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ scope: "others" }),
    });
    setMessage(
      response.ok
        ? "Other sessions were signed out."
        : "Sessions could not be revoked.",
    );
    await refresh();
    setBusy(undefined);
  }
  return (
    <section className="cloud-continuity">
      <header>
        <div>
          <p>CLOUD CONTINUITY</p>
          <h2>Backups and active sessions</h2>
        </div>
        <button
          aria-label="Refresh cloud status"
          onClick={() => void refresh()}
        >
          <RefreshCw />
        </button>
      </header>
      <div className="continuity-grid">
        <article>
          <div className="continuity-title">
            <Cloud />
            <div>
              <b>Encrypted backups</b>
              <span>AES-256-GCM · Five recent versions</span>
            </div>
            <button
              disabled={Boolean(busy)}
              onClick={() => void createBackup()}
            >
              {busy === "backup" ? (
                <LoaderCircle className="spin" />
              ) : (
                <CloudUpload />
              )}
              Back up now
            </button>
          </div>
          {backups.length ? (
            backups.map((item) => (
              <div className="cloud-row" key={item.id}>
                <div>
                  <b>{new Date(item.created_at).toLocaleString()}</b>
                  <span>{Math.ceil(item.byte_size / 1024)} KB encrypted</span>
                </div>
                <button
                  disabled={Boolean(busy)}
                  onClick={() => void restore(item.id)}
                >
                  {busy === item.id ? (
                    <LoaderCircle className="spin" />
                  ) : (
                    <CloudDownload />
                  )}
                  Restore
                </button>
              </div>
            ))
          ) : (
            <p className="cloud-empty">No cloud backups yet.</p>
          )}
        </article>
        <article>
          <div className="continuity-title">
            <ShieldCheck />
            <div>
              <b>Signed-in devices</b>
              <span>Verified Supabase sessions</span>
            </div>
            <button
              disabled={Boolean(busy)}
              onClick={() => void revokeOthers()}
            >
              {busy === "sessions" ? (
                <LoaderCircle className="spin" />
              ) : (
                <LogOut />
              )}
              Sign out others
            </button>
          </div>
          {sessions
            .filter((item) => !item.revoked_at)
            .map((item) => (
              <div className="cloud-row" key={item.id}>
                <div>
                  <b>
                    {item.device_name}
                    {item.current ? " · This device" : ""}
                  </b>
                  <span>
                    Active {new Date(item.last_seen_at).toLocaleString()}
                  </span>
                </div>
                <i>{item.current ? "Current" : "Active"}</i>
              </div>
            ))}
        </article>
      </div>
      {message && (
        <p role="status" className="cloud-message">
          {message}
        </p>
      )}
    </section>
  );
}
