"use client";

import { useEffect, useMemo, useState } from "react";
import { Languages, LoaderCircle, Save } from "lucide-react";
import { locales, type Locale } from "@/lib/i18n";
import {
  translationCompleteness,
  type CreatorTranslationInput,
} from "@/lib/creator-translations";

type Title = {
  id: string;
  name: string;
  native_name: string | null;
  synopsis: string;
  status: string;
};
type Translation = CreatorTranslationInput & {
  id: string;
  updatedAt: string;
};

const localeNames: Record<Locale, string> = {
  en: "English",
  ja: "日本語",
};

export function TranslationManager({ cloud }: { cloud: boolean }) {
  const [titles, setTitles] = useState<Title[]>([]);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [titleId, setTitleId] = useState("");
  const [locale, setLocale] = useState<Locale>("en");
  const [draft, setDraft] = useState({
    name: "",
    nativeName: "",
    synopsis: "",
    seoTitle: "",
    seoDescription: "",
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    if (!cloud) return;
    const response = await fetch("/api/v1/creator/translations", {
      cache: "no-store",
    });
    const data = (await response.json().catch(() => ({}))) as {
      titles?: Title[];
      translations?: Translation[];
      error?: string;
    };
    if (response.ok) {
      setTitles(data.titles ?? []);
      setTranslations(data.translations ?? []);
      setTitleId((current) => current || data.titles?.[0]?.id || "");
    } else setMessage(data.error ?? "Translations could not be loaded.");
  }

  useEffect(() => {
    const timeout = setTimeout(() => void load(), 0);
    return () => clearTimeout(timeout);
  }, [cloud]); // eslint-disable-line react-hooks/exhaustive-deps

  const current = useMemo(
    () =>
      translations.find(
        (translation) =>
          translation.titleId === titleId && translation.locale === locale,
      ),
    [locale, titleId, translations],
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      const title = titles.find((item) => item.id === titleId);
      setDraft({
        name: current?.name ?? (locale === "en" ? title?.name : "") ?? "",
        nativeName:
          current?.nativeName ??
          (locale === "ja" ? title?.native_name : "") ??
          "",
        synopsis:
          current?.synopsis ?? (locale === "en" ? title?.synopsis : "") ?? "",
        seoTitle: current?.seoTitle ?? "",
        seoDescription: current?.seoDescription ?? "",
      });
      setMessage("");
    }, 0);
    return () => clearTimeout(timeout);
  }, [current, locale, titleId, titles]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!titleId) return;
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/v1/creator/translations", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ titleId, locale, ...draft }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      translation?: Translation;
      error?: string;
    };
    if (response.ok && data.translation) {
      setTranslations((items) => [
        ...items.filter(
          (item) => item.titleId !== titleId || item.locale !== locale,
        ),
        data.translation!,
      ]);
      setMessage(`${localeNames[locale]} metadata saved.`);
    } else setMessage(data.error ?? "Translation could not be saved.");
    setBusy(false);
  }

  if (!cloud) return null;
  const completion = translationCompleteness(draft);
  return (
    <section id="translations" className="studio-panel translation-manager">
      <div className="panel-head">
        <div>
          <p>LOCALIZED CATALOG</p>
          <h2>Translated metadata</h2>
        </div>
        <select
          aria-label="Translation title"
          value={titleId}
          onChange={(event) => setTitleId(event.target.value)}
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
      <div className="translation-tabs" role="tablist">
        {locales.map((item) => {
          const translated = translations.find(
            (translation) =>
              translation.titleId === titleId && translation.locale === item,
          );
          return (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={locale === item}
              onClick={() => setLocale(item)}
            >
              <Languages />
              {localeNames[item]}
              <small>{translationCompleteness(translated)}%</small>
            </button>
          );
        })}
      </div>
      <form onSubmit={save}>
        <div className="translation-progress">
          <span>{completion}% complete</span>
          <progress max={100} value={completion} />
        </div>
        <label>
          Display title
          <input
            required
            maxLength={160}
            value={draft.name}
            onChange={(event) =>
              setDraft((value) => ({ ...value, name: event.target.value }))
            }
          />
        </label>
        <label>
          Native or alternate title
          <input
            maxLength={160}
            value={draft.nativeName}
            onChange={(event) =>
              setDraft((value) => ({
                ...value,
                nativeName: event.target.value,
              }))
            }
          />
        </label>
        <label className="translation-wide">
          Synopsis
          <textarea
            required
            maxLength={5000}
            value={draft.synopsis}
            onChange={(event) =>
              setDraft((value) => ({
                ...value,
                synopsis: event.target.value,
              }))
            }
          />
        </label>
        <label>
          SEO title
          <input
            maxLength={70}
            value={draft.seoTitle}
            onChange={(event) =>
              setDraft((value) => ({ ...value, seoTitle: event.target.value }))
            }
          />
          <small>{draft.seoTitle.length}/70</small>
        </label>
        <label>
          SEO description
          <textarea
            maxLength={160}
            value={draft.seoDescription}
            onChange={(event) =>
              setDraft((value) => ({
                ...value,
                seoDescription: event.target.value,
              }))
            }
          />
          <small>{draft.seoDescription.length}/160</small>
        </label>
        <div className="translation-save">
          {message && <span role="status">{message}</span>}
          <button disabled={busy || !titleId}>
            {busy ? <LoaderCircle className="spin" /> : <Save />}
            Save {localeNames[locale]}
          </button>
        </div>
      </form>
    </section>
  );
}
