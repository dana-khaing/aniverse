"use client";

import { useEffect, useState } from "react";
import { FileVideo, LoaderCircle, Plus, RefreshCcw, Upload, UsersRound } from "lucide-react";
import { initialCreatorWorkspace, useLocalDemoState } from "@/lib/local-demo";
import { storeMedia } from "@/lib/local-data/database";
import { useIndexedRecords } from "@/lib/local-data/use-indexed-records";
import type { StoredMedia } from "@/lib/local-data/types";
import { CreatorInsights } from "@/components/creator/creator-insights";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { CreatorStudioWorkspace } from "@/lib/creator-studio";

export function CreatorWorkspace() {
  const [workspace, setWorkspace] = useLocalDemoState(
    "aniverse.creator-workspace",
    initialCreatorWorkspace,
  );
  const [newTitle, setNewTitle] = useState("");
  const [uploadError, setUploadError] = useState<string>();
  const [studioError, setStudioError] = useState<string>();
  const [studioBusy, setStudioBusy] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("editor");
  const [invitations, setInvitations] = useState<Array<{ id: string; team: string; role: string; expiresAt: string }>>([]);
  const cloud = isSupabaseConfigured();
  const {
    records: storedMedia,
    loading: mediaLoading,
    refresh: refreshMedia,
  } = useIndexedRecords<StoredMedia>("media");

  async function loadStudio() {
    if (!cloud) return;
    setStudioBusy(true);
    setStudioError(undefined);
    const response = await fetch("/api/v1/creator/studio", { cache: "no-store" });
    const data = await response.json().catch(() => ({})) as { workspace?: CreatorStudioWorkspace; error?: string };
    if (response.ok && data.workspace) setWorkspace((current) => ({ ...current, team: data.workspace!.team, titles: data.workspace!.titles }));
    else setStudioError(data.error ?? "The creator workspace could not be loaded.");
    setStudioBusy(false);
  }

  useEffect(() => { const timeout = setTimeout(() => { void loadStudio(); if (cloud) void fetch("/api/v1/creator/invitations", { cache: "no-store" }).then((response) => response.ok ? response.json() : Promise.reject()).then((data: { invitations: typeof invitations }) => setInvitations(data.invitations)).catch(() => undefined); }, 0); return () => clearTimeout(timeout); }, [cloud]); // eslint-disable-line react-hooks/exhaustive-deps

  async function createTitle() {
    const name = newTitle.trim();
    if (!name) return;
    if (!cloud) {
      setWorkspace((current) => ({ ...current, titles: [...current.titles, { id: crypto.randomUUID(), name, status: "Draft", episodes: 0 }] }));
      setNewTitle("");
      return;
    }
    setStudioBusy(true);
    const response = await fetch("/api/v1/creator/studio", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type: "create-title", name }) });
    const data = await response.json().catch(() => ({})) as { title?: CreatorStudioWorkspace["titles"][number]; error?: string };
    if (response.ok && data.title) { setWorkspace((current) => ({ ...current, titles: [...current.titles, data.title!] })); setNewTitle(""); }
    else setStudioError(data.error ?? "The title could not be created.");
    setStudioBusy(false);
  }

  async function addEpisode(titleId: string) {
    if (!cloud) { setWorkspace((current) => ({ ...current, titles: current.titles.map((item) => item.id === titleId ? { ...item, episodes: item.episodes + 1 } : item) })); return; }
    setStudioBusy(true);
    const response = await fetch("/api/v1/creator/studio", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type: "add-episode", titleId }) });
    const data = await response.json().catch(() => ({})) as { error?: string };
    if (response.ok) setWorkspace((current) => ({ ...current, titles: current.titles.map((item) => item.id === titleId ? { ...item, episodes: item.episodes + 1 } : item) }));
    else setStudioError(data.error ?? "The episode could not be created.");
    setStudioBusy(false);
  }

  async function addMember(event: React.FormEvent) {
    event.preventDefault(); if (!memberEmail.trim()) return; setStudioBusy(true); setStudioError(undefined);
    const response = await fetch("/api/v1/creator/studio", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type: "add-member", email: memberEmail, role: memberRole }) });
    const data = await response.json().catch(() => ({})) as { invitation?: { email: string; role: string; expiresAt: string }; error?: string };
    if (response.ok && data.invitation) { setWorkspace((current) => ({ ...current, team: { ...current.team, invitations: [...(current.team.invitations ?? []).filter((item) => item.email !== data.invitation!.email), data.invitation!] } })); setMemberEmail(""); }
    else setStudioError(data.error ?? "Team invitation could not be created."); setStudioBusy(false);
  }

  async function answerInvitation(id: string, action: "accept" | "decline") { setStudioBusy(true); const response = await fetch("/api/v1/creator/invitations", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ invitationId: id, action }) }); if (response.ok) { setInvitations((current) => current.filter((item) => item.id !== id)); if (action === "accept") await loadStudio(); } else setStudioError("The invitation could not be updated."); setStudioBusy(false); }

  async function uploadVideo(file: File) {
    const title = workspace.titles[0];
    try {
      setUploadError(undefined);
      const asset = await storeMedia(file, {
        titleId: title?.id ?? "untitled",
        episode: Math.max(1, title?.episodes ?? 1),
        kind: "video",
        label: "Source",
      });
      setWorkspace((current) => ({
        ...current,
        uploads: [
          {
            id: crypto.randomUUID(),
            assetId: asset.id,
            filename: file.name,
            title: title?.name ?? "Untitled",
            status: "Ready",
            subtitles: [],
            size: file.size,
          },
          ...current.uploads,
        ],
      }));
      await refreshMedia();
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : "The video could not be stored locally",
      );
    }
  }

  return (
    <div className="studio-layout">
      <aside className="studio-sidebar">
        <b>CREATOR STUDIO</b>
        <a href="#overview">Overview</a>
        <a href="#analytics">Analytics</a>
        <a href="#releases">Releases</a>
        <a href="#titles">Titles</a>
        <a href="#uploads">Uploads</a>
        <a href="#team">Team</a>
      </aside>
      <div className="studio-content">
        <header>
          <div>
            <p>PUBLISHING WORKSPACE</p>
            <h1>{workspace.team.name}</h1>
          </div>
          <button className="studio-mode" onClick={() => void loadStudio()} disabled={!cloud || studioBusy}>
            {studioBusy ? <LoaderCircle className="spin" /> : cloud ? <RefreshCcw /> : null}
            {cloud ? "Cloud workspace" : "Local demo mode"}
          </button>
        </header>
        {studioError && <p className="form-error" role="alert">{studioError}</p>}
        {invitations.length > 0 && <section className="studio-panel"><div className="panel-head"><div><p>INVITATIONS</p><h2>Teams waiting for you</h2></div></div><div className="member-list">{invitations.map((invitation) => <div key={invitation.id}><span>{invitation.team.slice(0, 1)}</span><b>{invitation.team}<small>{invitation.role} · expires {new Date(invitation.expiresAt).toLocaleDateString()}</small></b><span><button disabled={studioBusy} onClick={() => void answerInvitation(invitation.id, "accept")}>Accept</button><button disabled={studioBusy} onClick={() => void answerInvitation(invitation.id, "decline")}>Decline</button></span></div>)}</div></section>}
        <section id="overview" className="metric-grid">
          <article>
            <b>{workspace.titles.length}</b>
            <span>Titles</span>
          </article>
          <article>
            <b>
              {workspace.titles.reduce((sum, title) => sum + title.episodes, 0)}
            </b>
            <span>Episodes</span>
          </article>
          <article>
            <b>{mediaLoading ? "…" : storedMedia.length}</b>
            <span>Stored assets</span>
          </article>
          <article>
            <b>{workspace.team.members.length}</b>
            <span>Team members</span>
          </article>
        </section>
        <CreatorInsights />
        <section id="titles" className="studio-panel">
          <div className="panel-head">
            <div>
              <p>CATALOG</p>
              <h2>Titles and episodes</h2>
            </div>
            <form
              onSubmit={(event) => { event.preventDefault(); void createTitle(); }}
            >
              <input
                aria-label="New title name"
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                placeholder="New title"
              />
              <button disabled={studioBusy}>
                <Plus size={15} />
                Create
              </button>
            </form>
          </div>
          <div className="studio-table">
            {workspace.titles.map((title) => (
              <div key={title.id}>
                <span className="title-mark">
                  {title.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)}
                </span>
                <div>
                  <b>{title.name}</b>
                  <small>{title.episodes} episodes</small>
                </div>
                <i
                  className={`status-${title.status.toLowerCase().replace(" ", "-")}`}
                >
                  {title.status}
                </i>
                <button
                  disabled={studioBusy}
                  onClick={() => void addEpisode(title.id)}
                >
                  Add episode
                </button>
              </div>
            ))}
          </div>
        </section>
        <section id="uploads" className="studio-panel">
          <div className="panel-head">
            <div>
              <p>LOCAL MEDIA LIBRARY</p>
              <h2>Uploads and subtitles</h2>
            </div>
            <label className="upload-button">
              <Upload size={15} />
              Upload video
              <input
                type="file"
                accept="video/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadVideo(file);
                  event.target.value = "";
                }}
              />
            </label>
          </div>
          {uploadError && (
            <p role="alert" className="form-error">
              {uploadError}
            </p>
          )}
          {workspace.uploads.length ? (
            <div className="upload-list">
              {workspace.uploads.map((upload) => (
                <article key={upload.id}>
                  <FileVideo />
                  <div>
                    <b>{upload.filename}</b>
                    <span>
                      {upload.title} ·{" "}
                      {upload.size
                        ? `${(upload.size / 1_048_576).toFixed(1)} MB`
                        : "Stored locally"}
                    </span>
                  </div>
                  <i>{upload.status}</i>
                </article>
              ))}
            </div>
          ) : (
            <div className="studio-empty">
              <FileVideo />
              <h3>No video assets yet</h3>
              <p>
                Upload a local video. The original file stays privately in this
                browser using IndexedDB.
              </p>
            </div>
          )}
        </section>
        <section id="team" className="studio-panel">
          <div className="panel-head">
            <div>
              <p>COLLABORATORS</p>
              <h2>Team access</h2>
            </div>
            {!cloud && <button
              onClick={() =>
                setWorkspace((current) => ({
                  ...current,
                  team: {
                    ...current.team,
                    members: [
                      ...current.team.members,
                      {
                        name: `Member ${current.team.members.length + 1}`,
                        role: "Uploader",
                      },
                    ],
                  },
                }))
              }
            >
              <UsersRound size={15} />
              Invite demo member
            </button>}
          </div>
          {cloud && workspace.team.role === "owner" && <form className="member-invite" onSubmit={(event) => void addMember(event)}><input required type="email" aria-label="Member email" value={memberEmail} onChange={(event) => setMemberEmail(event.target.value)} placeholder="Registered member email"/><select aria-label="Member role" value={memberRole} onChange={(event) => setMemberRole(event.target.value)}><option value="editor">Editor</option><option value="uploader">Uploader</option><option value="analyst">Analyst</option></select><button disabled={studioBusy}><UsersRound size={15}/>Add member</button></form>}
          <div className="member-list">
            {workspace.team.members.map((member) => (
              <div key={member.name}>
                <span>{member.name.slice(0, 1)}</span>
                <b>{member.name}</b>
                <i>{member.role}</i>
              </div>
            ))}
            {(workspace.team.invitations ?? []).map((invitation) => <div key={invitation.email}><span>{invitation.email.slice(0, 1).toUpperCase()}</span><b>{invitation.email}<small>Pending until {new Date(invitation.expiresAt).toLocaleDateString()}</small></b><i>{invitation.role}</i></div>)}
          </div>
        </section>
      </div>
    </div>
  );
}
