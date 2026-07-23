"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3, LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import { deleteRecord, putRecord } from "@/lib/local-data/database";
import { useIndexedRecords } from "@/lib/local-data/use-indexed-records";
import type { ChapterMarker } from "@/lib/local-data/types";
import {
  episodeMarkerInputSchema,
  markerCollectionError,
  normalizeEpisodeMarkers,
  type EpisodeMarkerInput,
} from "@/lib/creator-markers";

type EpisodeOption = {
  id: string;
  title: string;
  season: number;
  episode: number;
  episodeTitle: string;
  durationSeconds?: number | null;
};

type CloudMarker = EpisodeMarkerInput & {
  id: string;
  episodeId: string;
  position: number;
};

type LocalTitle = { id: string; name: string; episodes: number };

export function EpisodeMarkerEditor({
  cloud,
  localTitles,
}: {
  cloud: boolean;
  localTitles: LocalTitle[];
}) {
  const localEpisodes = useMemo(
    () =>
      localTitles.flatMap((title) =>
        Array.from({ length: Math.max(title.episodes, 1) }, (_, index) => ({
          id: `local:${title.id}:${index + 1}`,
          title: title.name,
          season: 1,
          episode: index + 1,
          episodeTitle: `Episode ${index + 1}`,
          titleId: title.id,
        })),
      ),
    [localTitles],
  );
  const { records: localMarkers, refresh: refreshLocalMarkers } =
    useIndexedRecords<ChapterMarker>("chapters");
  const [episodes, setEpisodes] = useState<EpisodeOption[]>([]);
  const [cloudMarkers, setCloudMarkers] = useState<CloudMarker[]>([]);
  const [episodeId, setEpisodeId] = useState("");
  const [draft, setDraft] = useState<EpisodeMarkerInput[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>();

  async function loadCloudMarkers() {
    if (!cloud) return;
    setBusy(true);
    const response = await fetch("/api/v1/creator/markers", {
      cache: "no-store",
    });
    const data = (await response.json().catch(() => ({}))) as {
      episodes?: EpisodeOption[];
      markers?: CloudMarker[];
      error?: string;
    };
    if (response.ok) {
      setEpisodes(data.episodes ?? []);
      setCloudMarkers(data.markers ?? []);
      setEpisodeId((current) => current || data.episodes?.[0]?.id || "");
    } else setMessage(data.error ?? "Marker timelines could not be loaded.");
    setBusy(false);
  }

  useEffect(() => {
    const timeout = setTimeout(() => void loadCloudMarkers(), 0);
    return () => clearTimeout(timeout);
  }, [cloud]); // eslint-disable-line react-hooks/exhaustive-deps

  const options = cloud ? episodes : localEpisodes;
  const selectedEpisodeId = episodeId || options[0]?.id || "";

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!selectedEpisodeId) {
        setDraft([]);
        return;
      }
      if (cloud) {
        setDraft(
          cloudMarkers
            .filter((marker) => marker.episodeId === selectedEpisodeId)
            .map(({ id, label, startSeconds, endSeconds, kind }) => ({
              id,
              label,
              startSeconds,
              endSeconds,
              kind,
            })),
        );
        return;
      }
      const selected = localEpisodes.find(
        (episode) => episode.id === selectedEpisodeId,
      );
      setDraft(
        localMarkers
          .filter(
            (marker) =>
              marker.titleId === selected?.titleId &&
              marker.episode === selected.episode,
          )
          .map((marker) => ({
            id: marker.id,
            label: marker.label,
            startSeconds: marker.start,
            endSeconds: marker.end,
            kind: marker.kind,
          })),
      );
    }, 0);
    return () => clearTimeout(timeout);
  }, [cloud, cloudMarkers, localEpisodes, localMarkers, selectedEpisodeId]);

  function updateMarker(
    id: string | undefined,
    field: keyof EpisodeMarkerInput,
    value: string | number | null,
  ) {
    setDraft((current) =>
      current.map((marker) =>
        marker.id === id ? { ...marker, [field]: value } : marker,
      ),
    );
    setMessage(undefined);
  }

  function addMarker() {
    setDraft((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        label: "New chapter",
        startSeconds:
          current.length === 0
            ? 0
            : Math.max(...current.map((marker) => marker.startSeconds)) + 60,
        endSeconds: null,
        kind: "chapter",
      },
    ]);
    setMessage(undefined);
  }

  async function saveTimeline() {
    const parsed = episodeMarkerInputSchema.array().safeParse(draft);
    if (!parsed.success) {
      setMessage(
        parsed.error.issues[0]?.message ?? "Check each marker time and label.",
      );
      return;
    }
    const sequenceError = markerCollectionError(parsed.data);
    if (sequenceError) {
      setMessage(sequenceError);
      return;
    }
    setBusy(true);
    setMessage(undefined);
    if (cloud) {
      const response = await fetch("/api/v1/creator/markers", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          episodeId: selectedEpisodeId,
          markers: parsed.data,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        markers?: CloudMarker[];
        error?: string;
      };
      if (response.ok) {
        setCloudMarkers((current) => [
          ...current.filter((marker) => marker.episodeId !== selectedEpisodeId),
          ...(data.markers ?? []),
        ]);
        setMessage("Timeline saved and ready for playback.");
      } else setMessage(data.error ?? "Timeline could not be saved.");
      setBusy(false);
      return;
    }
    const selected = localEpisodes.find(
      (episode) => episode.id === selectedEpisodeId,
    );
    if (!selected) {
      setBusy(false);
      return;
    }
    const previous = localMarkers.filter(
      (marker) =>
        marker.titleId === selected.titleId &&
        marker.episode === selected.episode,
    );
    await Promise.all(
      previous.map((marker) => deleteRecord("chapters", marker.id)),
    );
    await Promise.all(
      normalizeEpisodeMarkers(parsed.data).map((marker) =>
        putRecord<ChapterMarker>("chapters", {
          id: marker.id ?? crypto.randomUUID(),
          titleId: selected.titleId,
          episode: selected.episode,
          label: marker.label,
          start: marker.startSeconds,
          end: marker.endSeconds ?? undefined,
          kind: marker.kind,
        }),
      ),
    );
    await refreshLocalMarkers();
    setMessage("Timeline saved privately in this browser.");
    setBusy(false);
  }

  return (
    <div className="marker-manager">
      <div className="panel-head">
        <div>
          <p>PLAYBACK TIMELINE</p>
          <h3>Chapters and skip markers</h3>
        </div>
        <button
          type="button"
          onClick={addMarker}
          disabled={!selectedEpisodeId || busy}
        >
          <Plus />
          Add marker
        </button>
      </div>
      <label className="marker-episode">
        Episode
        <select
          value={selectedEpisodeId}
          onChange={(event) => setEpisodeId(event.target.value)}
          disabled={busy}
        >
          <option value="" disabled>
            Select episode
          </option>
          {options.map((episode) => (
            <option key={episode.id} value={episode.id}>
              {episode.title} · S{episode.season} E{episode.episode}
            </option>
          ))}
        </select>
      </label>
      {draft.length ? (
        <div className="marker-list">
          {normalizeEpisodeMarkers(draft).map((marker, index) => (
            <article key={marker.id}>
              <Clock3 aria-hidden="true" />
              <label>
                Type
                <select
                  aria-label={`Marker ${index + 1} type`}
                  value={marker.kind}
                  onChange={(event) =>
                    updateMarker(
                      marker.id,
                      "kind",
                      event.target.value as EpisodeMarkerInput["kind"],
                    )
                  }
                >
                  <option value="chapter">Chapter</option>
                  <option value="intro">Intro</option>
                  <option value="outro">Outro</option>
                </select>
              </label>
              <label className="marker-label">
                Label
                <input
                  aria-label={`Marker ${index + 1} label`}
                  maxLength={80}
                  value={marker.label}
                  onChange={(event) =>
                    updateMarker(marker.id, "label", event.target.value)
                  }
                />
              </label>
              <label>
                Start (sec)
                <input
                  aria-label={`Marker ${index + 1} start seconds`}
                  type="number"
                  min={0}
                  max={86_400}
                  value={marker.startSeconds}
                  onChange={(event) =>
                    updateMarker(
                      marker.id,
                      "startSeconds",
                      event.target.valueAsNumber,
                    )
                  }
                />
              </label>
              <label>
                End (sec)
                <input
                  aria-label={`Marker ${index + 1} end seconds`}
                  type="number"
                  min={1}
                  max={86_400}
                  placeholder="Optional"
                  value={marker.endSeconds ?? ""}
                  onChange={(event) =>
                    updateMarker(
                      marker.id,
                      "endSeconds",
                      event.target.value ? event.target.valueAsNumber : null,
                    )
                  }
                />
              </label>
              <button
                type="button"
                className="marker-delete"
                aria-label={`Delete ${marker.label}`}
                onClick={() =>
                  setDraft((current) =>
                    current.filter((item) => item.id !== marker.id),
                  )
                }
              >
                <Trash2 />
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="marker-empty">
          <Clock3 />
          <p>Add chapters, an intro, or an outro for this episode.</p>
        </div>
      )}
      <div className="marker-actions">
        {message && (
          <p className="form-error" role="status">
            {message}
          </p>
        )}
        <button
          type="button"
          onClick={() => void saveTimeline()}
          disabled={!selectedEpisodeId || busy}
        >
          {busy ? <LoaderCircle className="spin" /> : <Save />}
          Save timeline
        </button>
      </div>
    </div>
  );
}
