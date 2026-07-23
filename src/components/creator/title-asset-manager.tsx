"use client";

import { useEffect, useState } from "react";
import { Film, ImageIcon, LoaderCircle, Trash2, Upload } from "lucide-react";

type TitleOption = { id: string; name: string; slug: string; status: string };
type TitleAsset = {
  id: string;
  titleId: string;
  kind: "poster" | "backdrop" | "trailer";
  url: string;
  mimeType: string | null;
  bytes: number | null;
  updatedAt: string;
};

export function TitleAssetManager({ cloud }: { cloud: boolean }) {
  const [titles, setTitles] = useState<TitleOption[]>([]);
  const [assets, setAssets] = useState<TitleAsset[]>([]);
  const [titleId, setTitleId] = useState("");
  const [trailerUrl, setTrailerUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function loadAssets() {
    if (!cloud) return;
    const response = await fetch("/api/v1/creator/assets", {
      cache: "no-store",
    });
    const data = (await response.json().catch(() => ({}))) as {
      titles?: TitleOption[];
      assets?: TitleAsset[];
      error?: string;
    };
    if (response.ok) {
      setTitles(data.titles ?? []);
      setAssets(data.assets ?? []);
      setTitleId((current) => current || data.titles?.[0]?.id || "");
    } else setMessage(data.error ?? "Title assets could not be loaded.");
  }

  useEffect(() => {
    const timeout = setTimeout(() => void loadAssets(), 0);
    return () => clearTimeout(timeout);
  }, [cloud]); // eslint-disable-line react-hooks/exhaustive-deps

  async function uploadArtwork(
    kind: "poster" | "backdrop",
    file: File | undefined,
  ) {
    if (!file || !titleId) return;
    setBusy(true);
    setMessage("");
    const body = new FormData();
    body.set("titleId", titleId);
    body.set("kind", kind);
    body.set("file", file);
    const response = await fetch("/api/v1/creator/assets", {
      method: "POST",
      body,
    });
    const data = (await response.json().catch(() => ({}))) as {
      asset?: TitleAsset;
      error?: string;
    };
    if (response.ok && data.asset) {
      setAssets((current) => [
        ...current.filter(
          (asset) =>
            asset.titleId !== titleId || asset.kind !== data.asset!.kind,
        ),
        data.asset!,
      ]);
      setMessage(
        `${kind === "poster" ? "Poster" : "Backdrop"} uploaded successfully.`,
      );
    } else setMessage(data.error ?? "Artwork upload failed.");
    setBusy(false);
  }

  async function saveTrailer(event: React.FormEvent) {
    event.preventDefault();
    if (!titleId || !trailerUrl.trim()) return;
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/v1/creator/assets", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        titleId,
        kind: "trailer",
        sourceUrl: trailerUrl.trim(),
      }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      asset?: TitleAsset;
      error?: string;
    };
    if (response.ok && data.asset) {
      setAssets((current) => [
        ...current.filter(
          (asset) => asset.titleId !== titleId || asset.kind !== "trailer",
        ),
        data.asset!,
      ]);
      setTrailerUrl("");
      setMessage("Trailer reference saved.");
    } else setMessage(data.error ?? "Trailer could not be saved.");
    setBusy(false);
  }

  async function removeAsset(id: string) {
    setBusy(true);
    const response = await fetch(
      `/api/v1/creator/assets?id=${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
    if (response.ok) {
      setAssets((current) => current.filter((asset) => asset.id !== id));
      setMessage("Title asset deleted.");
    } else setMessage("Title asset could not be deleted.");
    setBusy(false);
  }

  if (!cloud)
    return (
      <section id="artwork" className="studio-panel">
        <div className="panel-head">
          <div>
            <p>BRAND ASSETS</p>
            <h2>Artwork and trailers</h2>
          </div>
        </div>
        <div className="studio-empty">
          <ImageIcon />
          <h3>Connect cloud providers to publish title artwork</h3>
          <p>Local video and subtitle tools remain available above.</p>
        </div>
      </section>
    );

  const selectedAssets = assets.filter((asset) => asset.titleId === titleId);
  return (
    <section id="artwork" className="studio-panel">
      <div className="panel-head">
        <div>
          <p>BRAND ASSETS</p>
          <h2>Artwork and trailers</h2>
        </div>
        <select
          aria-label="Artwork title"
          value={titleId}
          onChange={(event) => setTitleId(event.target.value)}
          disabled={busy}
        >
          <option value="" disabled>
            Select title
          </option>
          {titles.map((title) => (
            <option key={title.id} value={title.id}>
              {title.name}
            </option>
          ))}
        </select>
      </div>
      <div className="asset-upload-grid">
        {(["poster", "backdrop"] as const).map((kind) => (
          <label key={kind} className="asset-drop">
            <ImageIcon />
            <b>{kind === "poster" ? "Poster artwork" : "Hero backdrop"}</b>
            <span>
              {kind === "poster"
                ? "Vertical key art"
                : "Wide cinematic artwork"}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-label={`Upload ${kind}`}
              disabled={!titleId || busy}
              onChange={(event) => {
                void uploadArtwork(kind, event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            <i>
              <Upload />
              Choose image
            </i>
          </label>
        ))}
        <form className="trailer-reference" onSubmit={saveTrailer}>
          <Film />
          <b>Trailer</b>
          <span>Secure HTTPS video or embed URL</span>
          <input
            required
            type="url"
            aria-label="Trailer URL"
            value={trailerUrl}
            onChange={(event) => setTrailerUrl(event.target.value)}
            placeholder="https://…"
          />
          <button disabled={!titleId || busy}>Save trailer</button>
        </form>
      </div>
      {message && (
        <p className="form-error" role="status">
          {message}
        </p>
      )}
      <div className="title-asset-previews">
        {selectedAssets.map((asset) => (
          <article key={asset.id}>
            {asset.kind === "trailer" ? (
              <a href={asset.url} target="_blank" rel="noreferrer">
                <Film />
                Preview trailer
              </a>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={asset.url} alt={`${asset.kind} preview`} />
            )}
            <div>
              <b>{asset.kind}</b>
              <small>{new Date(asset.updatedAt).toLocaleDateString()}</small>
            </div>
            <button
              aria-label={`Delete ${asset.kind}`}
              disabled={busy}
              onClick={() => void removeAsset(asset.id)}
            >
              {busy ? <LoaderCircle className="spin" /> : <Trash2 />}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
