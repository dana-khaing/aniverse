"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, LoaderCircle, Send } from "lucide-react";

export function DmcaForm() {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/v1/legal/dmca", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        claimantName: form.get("claimantName"),
        claimantEmail: form.get("claimantEmail"),
        organization: form.get("organization"),
        workDescription: form.get("workDescription"),
        materialUrls: String(form.get("materialUrls"))
          .split(/\s+/)
          .filter(Boolean),
        goodFaithConfirmed: form.get("goodFaithConfirmed") === "on",
        accuracyConfirmed: form.get("accuracyConfirmed") === "on",
        signature: form.get("signature"),
      }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      request?: { id: string };
    };
    if (response.ok) {
      setComplete(true);
      setStatus(`Notice received. Reference ${data.request?.id}.`);
    } else setStatus(data.error ?? "Notice could not be submitted.");
    setBusy(false);
  }

  if (complete)
    return (
      <div className="dmca-success" role="status">
        <CheckCircle2 />
        <h2>Notice received</h2>
        <p>{status}</p>
        <span>Keep this reference for any follow-up or supporting evidence.</span>
      </div>
    );

  return (
    <form className="dmca-form" onSubmit={submit}>
      <div>
        <label>Full legal name<input required name="claimantName" minLength={2} maxLength={120} /></label>
        <label>Email address<input required name="claimantEmail" type="email" maxLength={320} /></label>
      </div>
      <label>Organization (optional)<input name="organization" maxLength={160} /></label>
      <label>Describe the copyrighted work<textarea required name="workDescription" minLength={30} maxLength={5000} rows={6} /></label>
      <label>Exact AniVerse URL(s)<textarea required name="materialUrls" rows={4} placeholder="One full URL per line" /></label>
      <label className="dmca-check"><input required name="goodFaithConfirmed" type="checkbox" />I have a good-faith belief that the disputed use is not authorized by the rights owner, its agent, or law.</label>
      <label className="dmca-check"><input required name="accuracyConfirmed" type="checkbox" />I confirm this notice is accurate and, under penalty of perjury, I am authorized to act for the rights owner.</label>
      <label>Electronic signature<input required name="signature" minLength={2} maxLength={120} /></label>
      <button disabled={busy}>{busy ? <LoaderCircle className="spin" /> : <Send />}Submit notice</button>
      {status && <p role="alert">{status}</p>}
    </form>
  );
}
