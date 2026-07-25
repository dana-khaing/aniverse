"use client";

import { Bot, Filter, History, LoaderCircle, UserCog } from "lucide-react";
import { useEffect, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type AuditEntry = {
  id: number;
  actor: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  summary: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

const demoEntries: AuditEntry[] = [
  {
    id: 1,
    actor: "AniVerse automation",
    action: "creator_strike.expired",
    entity_type: "creator_strike",
    entity_id: "strike-8472",
    summary: "creator_strike expired · creator_strike strike-8",
    metadata: { source: "automated_expiry" },
    created_at: "2026-07-25T09:00:00Z",
  },
  {
    id: 2,
    actor: "Dana Khaing",
    action: "takedown.executed",
    entity_type: "takedown",
    entity_id: "claim-1204",
    summary: "takedown executed · takedown claim-12",
    metadata: {},
    created_at: "2026-07-25T08:42:00Z",
  },
];

export function AuditTimeline() {
  const cloud = isSupabaseConfigured();
  const [entries, setEntries] = useState(demoEntries);
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    if (!cloud) return;
    setBusy(true);
    const params = new URLSearchParams({ limit: "50" });
    if (action) params.set("action", action);
    if (entityType) params.set("entityType", entityType);
    const response = await fetch(`/api/v1/admin/audit?${params}`, {
      cache: "no-store",
    });
    const data = (await response.json().catch(() => ({}))) as {
      entries?: AuditEntry[];
      error?: string;
    };
    if (response.ok) setEntries(data.entries ?? []);
    else setMessage(data.error ?? "Audit history could not be loaded.");
    setBusy(false);
  }

  useEffect(() => {
    const timeout = setTimeout(() => void load(), 0);
    return () => clearTimeout(timeout);
  }, [cloud]); // eslint-disable-line react-hooks/exhaustive-deps

  const visible = cloud
    ? entries
    : entries.filter(
        (entry) =>
          (!action || entry.action.startsWith(action)) &&
          (!entityType || entry.entity_type === entityType),
      );
  return (
    <section className="moderation-panel audit-timeline">
      <div className="panel-title">
        <div>
          <p>ACCOUNTABILITY</p>
          <h2>Audit history</h2>
        </div>
        <History />
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void load();
        }}
      >
        <input
          aria-label="Audit action filter"
          value={action}
          onChange={(event) => setAction(event.target.value)}
          placeholder="Action prefix"
        />
        <select
          aria-label="Audit entity filter"
          value={entityType}
          onChange={(event) => setEntityType(event.target.value)}
        >
          <option value="">All entities</option>
          <option value="creator_strike">Creator strikes</option>
          <option value="takedown">Takedowns</option>
          <option value="appeal">Appeals</option>
          <option value="report_evidence">Evidence</option>
        </select>
        <button disabled={busy}>
          {busy ? <LoaderCircle className="spin" /> : <Filter />} Filter
        </button>
      </form>
      <div className="audit-list">
        {visible.map((entry) => (
          <article key={entry.id}>
            <span>
              {entry.actor === "AniVerse automation" ? <Bot /> : <UserCog />}
            </span>
            <div>
              <b>{entry.summary}</b>
              <small>
                {entry.actor} ·{" "}
                {new Date(entry.created_at).toLocaleString("en-GB")}
              </small>
            </div>
            <code>{entry.action}</code>
          </article>
        ))}
      </div>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
