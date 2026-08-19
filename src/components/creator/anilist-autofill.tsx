"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, Sparkles } from "lucide-react";

type AniListResult = {
  id: number;
  title: string;
  nativeTitle: string;
  synopsis: string;
  year: number | null;
  format: string | null;
  coverImage: string | null;
  siteUrl: string;
};

export function AniListAutofill({
  onApply,
}: {
  onApply: (result: { nativeName: string; synopsis: string }) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AniListResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (query.trim().length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setBusy(true);
      fetch(`/api/v1/creator/anilist-search?q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
      })
        .then((response) => response.json())
        .then((payload: { results?: AniListResult[]; error?: string }) => {
          setResults(payload.results ?? []);
          setMessage(payload.error ?? "");
        })
        .catch(() => undefined)
        .finally(() => setBusy(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const visibleResults = query.trim().length >= 2 ? results : [];
  return (
    <div className="anilist-autofill">
      <label>
        <Sparkles size={14} />
        <input
          aria-label="Autofill from AniList"
          placeholder="Autofill from AniList…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoComplete="off"
        />
        {busy && <LoaderCircle size={14} className="spin" />}
      </label>
      {visibleResults.length > 0 && (
        <ul role="listbox">
          {visibleResults.map((result) => (
            <li key={result.id}>
              <button
                type="button"
                onClick={() => {
                  onApply({
                    nativeName: result.nativeTitle,
                    synopsis: result.synopsis,
                  });
                  setQuery("");
                  setResults([]);
                }}
              >
                <b>{result.title}</b>
                <span>
                  {result.format ?? "TV"} · {result.year ?? "—"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {message && (
        <p className="form-error" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
