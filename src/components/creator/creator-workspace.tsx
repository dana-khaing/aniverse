"use client";

import { useState } from "react";
import { FileVideo, Plus, Upload, UsersRound } from "lucide-react";
import { initialCreatorWorkspace, useLocalDemoState } from "@/lib/local-demo";
import { storeMedia } from "@/lib/local-data/database";
import { useIndexedRecords } from "@/lib/local-data/use-indexed-records";
import type { StoredMedia } from "@/lib/local-data/types";

export function CreatorWorkspace() {
  const [workspace, setWorkspace] = useLocalDemoState("aniverse.creator-workspace", initialCreatorWorkspace);
  const [newTitle, setNewTitle] = useState("");
  const [uploadError, setUploadError] = useState<string>();
  const { records: storedMedia, loading: mediaLoading, refresh: refreshMedia } = useIndexedRecords<StoredMedia>("media");

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
        uploads: [{ id: crypto.randomUUID(), assetId: asset.id, filename: file.name, title: title?.name ?? "Untitled", status: "Ready", subtitles: [], size: file.size }, ...current.uploads],
      }));
      await refreshMedia();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "The video could not be stored locally");
    }
  }

  return <div className="studio-layout">
    <aside className="studio-sidebar"><b>CREATOR STUDIO</b><a href="#overview">Overview</a><a href="#titles">Titles</a><a href="#uploads">Uploads</a><a href="#team">Team</a></aside>
    <div className="studio-content">
      <header><div><p>PUBLISHING WORKSPACE</p><h1>{workspace.team.name}</h1></div><span>Local demo mode</span></header>
      <section id="overview" className="metric-grid"><article><b>{workspace.titles.length}</b><span>Titles</span></article><article><b>{workspace.titles.reduce((sum,title)=>sum+title.episodes,0)}</b><span>Episodes</span></article><article><b>{mediaLoading ? "…" : storedMedia.length}</b><span>Stored assets</span></article><article><b>{workspace.team.members.length}</b><span>Team members</span></article></section>
      <section id="titles" className="studio-panel"><div className="panel-head"><div><p>CATALOG</p><h2>Titles and episodes</h2></div><form onSubmit={(event)=>{event.preventDefault();if(!newTitle.trim())return;setWorkspace((current)=>({...current,titles:[...current.titles,{id:crypto.randomUUID(),name:newTitle.trim(),status:"Draft",episodes:0}]}));setNewTitle("");}}><input aria-label="New title name" value={newTitle} onChange={(event)=>setNewTitle(event.target.value)} placeholder="New title"/><button><Plus size={15}/>Create</button></form></div><div className="studio-table">{workspace.titles.map((title)=><div key={title.id}><span className="title-mark">{title.name.split(" ").map(part=>part[0]).join("").slice(0,2)}</span><div><b>{title.name}</b><small>{title.episodes} episodes</small></div><i className={`status-${title.status.toLowerCase().replace(" ","-")}`}>{title.status}</i><button onClick={()=>setWorkspace((current)=>({...current,titles:current.titles.map((item)=>item.id===title.id?{...item,episodes:item.episodes+1}:item)}))}>Add episode</button></div>)}</div></section>
      <section id="uploads" className="studio-panel"><div className="panel-head"><div><p>LOCAL MEDIA LIBRARY</p><h2>Uploads and subtitles</h2></div><label className="upload-button"><Upload size={15}/>Upload video<input type="file" accept="video/*" onChange={(event)=>{const file=event.target.files?.[0];if(file) void uploadVideo(file);event.target.value="";}}/></label></div>{uploadError && <p role="alert" className="form-error">{uploadError}</p>}{workspace.uploads.length ? <div className="upload-list">{workspace.uploads.map((upload)=><article key={upload.id}><FileVideo/><div><b>{upload.filename}</b><span>{upload.title} · {upload.size ? `${(upload.size / 1_048_576).toFixed(1)} MB` : "Stored locally"}</span></div><i>{upload.status}</i></article>)}</div>:<div className="studio-empty"><FileVideo/><h3>No video assets yet</h3><p>Upload a local video. The original file stays privately in this browser using IndexedDB.</p></div>}</section>
      <section id="team" className="studio-panel"><div className="panel-head"><div><p>COLLABORATORS</p><h2>Team access</h2></div><button onClick={()=>setWorkspace((current)=>({...current,team:{...current.team,members:[...current.team.members,{name:`Member ${current.team.members.length+1}`,role:"Uploader"}]}}))}><UsersRound size={15}/>Invite demo member</button></div><div className="member-list">{workspace.team.members.map((member)=><div key={member.name}><span>{member.name.slice(0,1)}</span><b>{member.name}</b><i>{member.role}</i></div>)}</div></section>
    </div>
  </div>;
}
