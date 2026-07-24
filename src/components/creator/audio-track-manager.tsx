"use client";

import { AudioLines, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

type Episode = {
  id: string;
  title: string;
  season: number;
  episode: number;
  episodeTitle: string;
};
type Track = {
  id: string;
  episode_id: string;
  language_code: string;
  label: string;
  is_default: boolean;
  status: "preparing" | "ready" | "errored";
  error_message: string | null;
};

export function AudioTrackManager({ cloud }: { cloud: boolean }) {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [episodeId, setEpisodeId] = useState("");
  const [languageCode, setLanguageCode] = useState("ja");
  const [label, setLabel] = useState("Japanese");
  const [sourceUrl, setSourceUrl] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    if (!cloud) return;
    const response = await fetch("/api/v1/creator/audio-tracks", {
      cache: "no-store",
    });
    if (!response.ok) return;
    const data = (await response.json()) as {
      episodes: Episode[];
      tracks: Track[];
    };
    setEpisodes(data.episodes);
    setTracks(data.tracks);
    setEpisodeId((current) => current || data.episodes[0]?.id || "");
  }

  useEffect(() => {
    const timeout = setTimeout(() => void load(), 0);
    return () => clearTimeout(timeout);
  }, [cloud]); // eslint-disable-line react-hooks/exhaustive-deps

  async function addTrack(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/v1/creator/audio-tracks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        episodeId,
        languageCode,
        label,
        sourceUrl,
        isDefault,
      }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      track?: Track;
      error?: string;
    };
    if (response.ok && data.track) {
      setTracks((current) => [
        data.track!,
        ...current.map((track) =>
          isDefault && track.episode_id === episodeId
            ? { ...track, is_default: false }
            : track,
        ),
      ]);
      setSourceUrl("");
      setMessage("Mux is preparing the new audio track.");
    } else setMessage(data.error ?? "The audio track could not be added.");
    setBusy(false);
  }

  async function removeTrack(id: string) {
    setBusy(true);
    const response = await fetch(
      `/api/v1/creator/audio-tracks?id=${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
    if (response.ok)
      setTracks((current) => current.filter((track) => track.id !== id));
    else setMessage("The audio track could not be removed.");
    setBusy(false);
  }

  return (
    <section className="studio-panel audio-track-manager">
      <div className="panel-head">
        <div>
          <p>MULTI-LANGUAGE SOUND</p>
          <h2>Episode audio tracks</h2>
        </div>
        <AudioLines />
      </div>
      {!cloud ? (
        <div className="studio-empty">
          <AudioLines />
          <h3>Cloud audio is ready to connect</h3>
          <p>
            Connect Supabase and Mux to attach dubbed audio to production
            streams.
          </p>
        </div>
      ) : (
        <>
          <form onSubmit={(event) => void addTrack(event)}>
            <select
              aria-label="Audio episode"
              required
              value={episodeId}
              onChange={(event) => setEpisodeId(event.target.value)}
            >
              <option value="" disabled>
                Select episode
              </option>
              {episodes.map((episode) => (
                <option key={episode.id} value={episode.id}>
                  {episode.title} · S{episode.season} E{episode.episode}
                </option>
              ))}
            </select>
            <input
              aria-label="Audio language"
              required
              pattern="[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2}|-[0-9]{3})?"
              value={languageCode}
              onChange={(event) => setLanguageCode(event.target.value)}
              placeholder="ja"
            />
            <input
              aria-label="Audio label"
              required
              maxLength={80}
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Japanese"
            />
            <input
              className="audio-source"
              aria-label="Audio source URL"
              required
              type="url"
              pattern="https://.*"
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
              placeholder="https://media.example/audio-ja.m4a"
            />
            <label>
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(event) => setIsDefault(event.target.checked)}
              />{" "}
              Preferred track
            </label>
            <button disabled={busy || !episodeId}>
              {busy ? <LoaderCircle className="spin" /> : <Plus />} Add audio
            </button>
          </form>
          {message && (
            <p className="audio-track-message" role="status">
              {message}
            </p>
          )}
          <div className="audio-track-list">
            {tracks.map((track) => {
              const episode = episodes.find(
                (item) => item.id === track.episode_id,
              );
              return (
                <article key={track.id}>
                  <AudioLines />
                  <div>
                    <b>
                      {track.label} <small>{track.language_code}</small>
                    </b>
                    <span>
                      {episode
                        ? `${episode.title} · S${episode.season} E${episode.episode}`
                        : "Episode"}
                      {track.is_default ? " · Preferred" : ""}
                    </span>
                    {track.error_message && <em>{track.error_message}</em>}
                  </div>
                  <i className={`status-${track.status}`}>{track.status}</i>
                  <button
                    aria-label={`Delete ${track.label} audio`}
                    disabled={busy}
                    onClick={() => void removeTrack(track.id)}
                  >
                    <Trash2 />
                  </button>
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
