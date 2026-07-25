"use client";

import {
  CheckCircle2,
  Gavel,
  LoaderCircle,
  RotateCcw,
  Scale,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type Takedown = {
  id: string;
  claimant_name: string;
  claimant_email: string;
  rights_basis: string;
  status: string;
  titles?: { name: string; status: string } | null;
};
type Appeal = {
  id: string;
  creator: string;
  statement: string;
  status: string;
  outcome: string | null;
  creator_strikes?: { reason: string; takedown_id: string | null } | null;
};

const demoTakedowns: Takedown[] = [
  {
    id: "local-takedown",
    claimant_name: "Asteria Rights Ltd",
    claimant_email: "rights@example.com",
    rights_basis:
      "Exclusive worldwide streaming rights documentation supplied.",
    status: "open",
    titles: { name: "Echoes of Asteria", status: "published" },
  },
];
const demoAppeals: Appeal[] = [
  {
    id: "local-appeal",
    creator: "Voltage Frame",
    statement:
      "The licensed source agreement was omitted from the original response.",
    status: "appealed",
    outcome: null,
    creator_strikes: {
      reason: "Rights documentation incomplete",
      takedown_id: "local-takedown",
    },
  },
];

export function EnforcementCenter() {
  const cloud = isSupabaseConfigured();
  const [takedowns, setTakedowns] = useState(demoTakedowns);
  const [appeals, setAppeals] = useState(demoAppeals);
  const [notes, setNotes] = useState(
    "Rights documentation and ownership chain reviewed.",
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!cloud) return;
    const controller = new AbortController();
    void fetch("/api/v1/admin/enforcement", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { takedowns: Takedown[]; appeals: Appeal[] }) => {
        setTakedowns(data.takedowns);
        setAppeals(data.appeals);
      })
      .catch(() => setMessage("Enforcement queue could not be loaded."));
    return () => controller.abort();
  }, [cloud]);

  async function action(payload: object) {
    setBusy(true);
    setMessage("");
    if (cloud) {
      const response = await fetch("/api/v1/admin/enforcement", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        setMessage("Enforcement transaction failed.");
        setBusy(false);
        return false;
      }
    }
    setBusy(false);
    return true;
  }

  async function execute(id: string) {
    if (!(await action({ action: "execute-takedown", id, notes }))) return;
    setTakedowns((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "actioned",
              titles: item.titles
                ? { ...item.titles, status: "removed" }
                : item.titles,
            }
          : item,
      ),
    );
    setMessage("Takedown executed atomically.");
  }

  async function resolve(id: string, decision: "approved" | "denied") {
    if (!(await action({ action: "resolve-appeal", id, decision, notes })))
      return;
    setAppeals((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, status: "closed", outcome: decision }
          : item,
      ),
    );
    setMessage(
      decision === "approved"
        ? "Appeal approved; strike revoked and linked title restored."
        : "Appeal denied with documented reasoning.",
    );
  }

  return (
    <section className="moderation-panel enforcement-center">
      <div className="panel-title">
        <div>
          <p>ENFORCEMENT</p>
          <h2>Appeals and takedowns</h2>
        </div>
        <Scale />
      </div>
      <label>
        Decision record
        <textarea
          aria-label="Enforcement notes"
          minLength={10}
          maxLength={2000}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </label>
      <div className="enforcement-columns">
        <div>
          <h3>
            <Gavel /> Takedown execution
          </h3>
          {takedowns.map((item) => (
            <article key={item.id}>
              <header>
                <b>{item.titles?.name ?? "Title"}</b>
                <i>{item.status}</i>
              </header>
              <p>{item.rights_basis}</p>
              <small>
                {item.claimant_name} · {item.claimant_email}
              </small>
              <button
                disabled={
                  busy || item.status === "actioned" || notes.length < 10
                }
                onClick={() => void execute(item.id)}
              >
                {busy ? <LoaderCircle className="spin" /> : <Gavel />}
                Execute takedown
              </button>
            </article>
          ))}
        </div>
        <div>
          <h3>
            <RotateCcw /> Creator appeals
          </h3>
          {appeals.map((item) => (
            <article key={item.id}>
              <header>
                <b>{item.creator}</b>
                <i>{item.outcome ?? item.status}</i>
              </header>
              <p>{item.statement}</p>
              <small>{item.creator_strikes?.reason}</small>
              <footer>
                <button
                  disabled={
                    busy || item.status !== "appealed" || notes.length < 10
                  }
                  onClick={() => void resolve(item.id, "approved")}
                >
                  <CheckCircle2 /> Approve and restore
                </button>
                <button
                  disabled={
                    busy || item.status !== "appealed" || notes.length < 10
                  }
                  onClick={() => void resolve(item.id, "denied")}
                >
                  <XCircle /> Deny
                </button>
              </footer>
            </article>
          ))}
        </div>
      </div>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
