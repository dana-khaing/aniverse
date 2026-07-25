"use client";

import {
  CheckCircle2,
  ExternalLink,
  FileSearch,
  Fingerprint,
  LoaderCircle,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type Evidence = {
  id: string;
  report_id: string;
  kind: string;
  source_url: string | null;
  description: string;
  sha256: string | null;
  review_status: "pending" | "verified" | "rejected";
  review_notes: string | null;
  created_at: string;
  reports?: { reason: string; entity_type: string; entity_id: string } | null;
};

const localEvidence: Evidence[] = [
  {
    id: "local-evidence-1",
    report_id: "local-report-1",
    kind: "image",
    source_url: "https://example.com/evidence/screenshot",
    description:
      "Screenshot showing the reported comment and its surrounding conversation.",
    sha256: "4f0a1d71c95d9d91a456ee669566f29f32c006fea737bbaa5c03ddba4c113f3b",
    review_status: "pending",
    review_notes: null,
    created_at: "2026-07-25T08:30:00Z",
    reports: {
      reason: "Targeted harassment",
      entity_type: "comment",
      entity_id: "comment-1042",
    },
  },
];

export function EvidenceReview() {
  const cloud = isSupabaseConfigured();
  const [items, setItems] = useState<Evidence[]>(localEvidence);
  const [selected, setSelected] = useState(localEvidence[0]?.id ?? "");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!cloud) return;
    const controller = new AbortController();
    void fetch("/api/v1/admin/evidence", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { evidence: Evidence[] }) => {
        setItems(data.evidence);
        setSelected(data.evidence[0]?.id ?? "");
      })
      .catch(() => setMessage("Evidence queue could not be loaded."));
    return () => controller.abort();
  }, [cloud]);

  async function decide(decision: "verified" | "rejected") {
    const item = items.find((entry) => entry.id === selected);
    if (!item) return;
    setBusy(true);
    setMessage("");
    if (cloud) {
      const response = await fetch("/api/v1/admin/evidence", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: item.id, decision, notes }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok) {
        setMessage(data.error ?? "Evidence decision failed.");
        setBusy(false);
        return;
      }
    }
    setItems((current) =>
      current.map((entry) =>
        entry.id === item.id
          ? { ...entry, review_status: decision, review_notes: notes }
          : entry,
      ),
    );
    setMessage(`Evidence ${decision}.`);
    setBusy(false);
  }

  const active = items.find((item) => item.id === selected);
  return (
    <section className="moderation-panel evidence-review">
      <div className="panel-title">
        <div>
          <p>CHAIN OF CUSTODY</p>
          <h2>Evidence review</h2>
        </div>
        <span>
          {items.filter((item) => item.review_status === "pending").length}{" "}
          pending
        </span>
      </div>
      <div className="evidence-layout">
        <nav aria-label="Evidence queue">
          {items.map((item) => (
            <button
              key={item.id}
              aria-current={selected === item.id}
              onClick={() => {
                setSelected(item.id);
                setNotes(item.review_notes ?? "");
              }}
            >
              <FileSearch />
              <span>
                <b>{item.reports?.reason ?? "Reported evidence"}</b>
                <small>
                  {item.kind} · {item.review_status}
                </small>
              </span>
            </button>
          ))}
        </nav>
        {active ? (
          <article>
            <header>
              <div>
                <p>
                  {active.reports?.entity_type} · {active.reports?.entity_id}
                </p>
                <h3>{active.reports?.reason}</h3>
              </div>
              <i>{active.review_status}</i>
            </header>
            <p>{active.description}</p>
            {active.sha256 && (
              <code>
                <Fingerprint />
                SHA-256 {active.sha256}
              </code>
            )}
            {active.source_url && (
              <a
                href={active.source_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Inspect source <ExternalLink />
              </a>
            )}
            <label>
              Review notes
              <textarea
                aria-label="Evidence review notes"
                maxLength={2000}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Document authenticity checks and decision context…"
              />
            </label>
            <footer>
              <button
                disabled={busy || active.review_status !== "pending"}
                onClick={() => void decide("verified")}
              >
                {busy ? <LoaderCircle className="spin" /> : <CheckCircle2 />}
                Verify
              </button>
              <button
                disabled={busy || active.review_status !== "pending"}
                onClick={() => void decide("rejected")}
              >
                <XCircle />
                Reject
              </button>
            </footer>
          </article>
        ) : (
          <div className="studio-empty">
            <FileSearch />
            <h3>No evidence waiting</h3>
          </div>
        )}
      </div>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
