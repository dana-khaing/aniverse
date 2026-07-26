"use client";

import { CheckCircle2, Circle, LoaderCircle, Rocket } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  creatorReleaseReadiness,
  type ReadinessCheck,
} from "@/lib/creator-readiness";

type Readiness = {
  titleId: string;
  titleName: string;
  status: string;
  checks: ReadinessCheck[];
  completed: number;
  total: number;
  percent: number;
  canSubmit: boolean;
};

const localReadiness: Readiness[] = [
  creatorReleaseReadiness({
    titleId: "b7c096d8-28dd-46b7-84fb-13ea8483b80b",
    titleName: "Echoes of Asteria",
    status: "draft",
    episodeIds: ["218d82f6-7fe3-4691-8c64-dbb69afc1709"],
    assetKinds: ["poster", "backdrop", "trailer"],
    translationLocales: ["en", "ja"],
    readyVideoEpisodeIds: ["218d82f6-7fe3-4691-8c64-dbb69afc1709"],
    readyAudioEpisodeIds: [],
  }),
];

export function ReleaseReadiness({ cloud }: { cloud: boolean }) {
  const [titles, setTitles] = useState(localReadiness);
  const [titleId, setTitleId] = useState(localReadiness[0]?.titleId ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (!cloud) return;
    setBusy(true);
    const response = await fetch("/api/v1/creator/readiness", {
      cache: "no-store",
    });
    const data = (await response.json().catch(() => ({}))) as {
      titles?: Readiness[];
      error?: string;
    };
    if (response.ok && data.titles) {
      setTitles(data.titles);
      setTitleId((current) =>
        data.titles?.some((title) => title.titleId === current)
          ? current
          : (data.titles?.[0]?.titleId ?? ""),
      );
      setMessage("");
    } else setMessage(data.error ?? "Readiness could not be loaded.");
    setBusy(false);
  }, [cloud]);

  useEffect(() => {
    const timeout = setTimeout(() => void load(), 0);
    return () => clearTimeout(timeout);
  }, [load]);

  const selected = titles.find((title) => title.titleId === titleId);

  async function submit() {
    if (!selected?.canSubmit) return;
    setBusy(true);
    setMessage("");
    if (cloud) {
      const response = await fetch("/api/v1/creator/readiness", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ titleId: selected.titleId }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok) {
        setMessage(data.error ?? "Review submission failed.");
        setBusy(false);
        return;
      }
    }
    setTitles((current) =>
      current.map((title) =>
        title.titleId === selected.titleId
          ? { ...title, status: "review" }
          : title,
      ),
    );
    setMessage("Title submitted for moderation review.");
    setBusy(false);
  }

  return (
    <section id="media-readiness" className="studio-panel readiness-panel">
      <div className="panel-head">
        <div>
          <p>PUBLISHING GATE</p>
          <h2>Media and metadata readiness</h2>
        </div>
        <select
          aria-label="Readiness title"
          value={titleId}
          onChange={(event) => setTitleId(event.target.value)}
        >
          {titles.map((title) => (
            <option key={title.titleId} value={title.titleId}>
              {title.titleName}
            </option>
          ))}
        </select>
      </div>
      {selected ? (
        <div className="readiness-layout">
          <div className="readiness-score">
            <strong>{selected.percent}%</strong>
            <progress value={selected.percent} max={100}>
              {selected.percent}%
            </progress>
            <span>
              {selected.completed} of {selected.total} publishing requirements
            </span>
          </div>
          <div className="readiness-checks">
            {selected.checks.map((check) => (
              <a
                key={check.key}
                href={check.target}
                className={check.complete ? "complete" : ""}
              >
                {check.complete ? <CheckCircle2 /> : <Circle />}
                <span>
                  <b>{check.label}</b>
                  <small>{check.detail}</small>
                </span>
              </a>
            ))}
          </div>
          <footer>
            <span>
              Current status: <b>{selected.status}</b>
            </span>
            <button
              disabled={
                busy || !selected.canSubmit || selected.status === "review"
              }
              onClick={() => void submit()}
            >
              {busy ? <LoaderCircle className="spin" /> : <Rocket />}
              {selected.status === "review"
                ? "Review requested"
                : "Submit for review"}
            </button>
          </footer>
        </div>
      ) : (
        <div className="studio-empty">
          <Rocket />
          <h3>Create a title to begin its publishing checklist</h3>
        </div>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
