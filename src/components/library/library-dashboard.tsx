"use client";

import Link from "next/link";
import { Bookmark, Check, Clock3, Heart, ListPlus, Play, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { catalog } from "@/lib/catalog";
import { useLibrary } from "@/lib/use-library";

function Poster({ slug }: { slug: string }) {
  const title = catalog.find((item) => item.slug === slug);
  return <span className={`library-poster poster-${title?.tone ?? "violet"}`}>{title?.name.split(" ").map((part) => part[0]).join("").slice(0, 2) ?? "AV"}</span>;
}

export function LibraryDashboard() {
  const { library, dispatch, mode, message } = useLibrary();
  const [listName, setListName] = useState("");
  const [editing, setEditing] = useState<string>();
  const titleFor = (slug: string) => catalog.find((title) => title.slug === slug);

  return <div className="library-wrap">
    <header><div><p>YOUR ANIVERSE</p><h1>My library</h1><span className={`sync-pill ${mode}`}>{mode === "cloud" ? <><Check/> Synced</> : mode === "syncing" ? "Syncing…" : "Saved on this device"}</span></div><Link href="/browse">Discover more</Link></header>
    {message && <p className="library-notice" role="status">{message}</p>}

    <section><div className="library-heading"><Clock3/><div><p>PICK UP WHERE YOU LEFT OFF</p><h2>Continue watching</h2></div></div>
      <div className="continue-grid">{library.progress.filter((item) => !item.completed).slice(0,4).map((item) => <Link href={`/watch/${item.slug}/${item.episode}`} key={`${item.slug}-${item.episode}`}><div className="continue-art"><Play fill="currentColor"/><i style={{width:`${Math.min(100, Math.round(item.position/item.duration*100))}%`}}/></div><b>{item.title}</b><span>Episode {item.episode} · {Math.round(item.position/item.duration*100)}%</span></Link>)}</div>
      {!library.progress.some((item) => !item.completed) && <p className="library-empty">Start an episode and it will appear here.</p>}
    </section>

    <section><div className="library-heading"><Bookmark/><div><p>WATCH NEXT</p><h2>Watchlist</h2></div></div>
      <div className="favorite-list">{library.watchlist.map((slug) => { const title=titleFor(slug); return <article key={slug}><Poster slug={slug}/><div><b>{title?.name ?? slug}</b><small>{title?.genre.join(" · ")}</small></div><Link href={`/anime/${slug}`}>Open</Link><button aria-label={`Remove ${title?.name ?? slug} from Watchlist`} onClick={() => void dispatch({type:"toggle-watchlist",slug})}><X/></button></article> })}</div>
      {!library.watchlist.length && <p className="library-empty">Your Watchlist is ready for the next universe you discover.</p>}
    </section>

    <section><div className="library-heading"><Heart/><div><p>SAVED TITLES</p><h2>Favorites</h2></div></div>
      <div className="favorite-list">{library.favorites.map((slug) => { const title=titleFor(slug); return <article key={slug}><Poster slug={slug}/><div><b>{title?.name ?? slug}</b><small>{title?.genre.join(" · ")}</small></div><Link href={`/anime/${slug}`}>Open</Link><button aria-label={`Remove ${title?.name ?? slug} from favorites`} onClick={() => void dispatch({type:"toggle-favorite",slug})}><Trash2/></button></article> })}</div>
    </section>

    <section><div className="library-heading"><Clock3/><div><p>RECENT ACTIVITY</p><h2>Watch history</h2></div></div>
      <div className="history-list">{library.progress.map((item) => <article key={`${item.slug}-${item.episode}`}><div><b>{item.title}</b><span>Episode {item.episode} · {item.completed ? "Completed" : `${Math.round(item.position/item.duration*100)}% watched`}</span></div><time>{new Date(item.watchedAt).toLocaleDateString()}</time><Link href={`/watch/${item.slug}/${item.episode}`}><Play/>Resume</Link><button aria-label={`Remove ${item.title} episode ${item.episode} from history`} onClick={() => void dispatch({type:"remove-history",slug:item.slug,episode:item.episode})}><Trash2/></button></article>)}</div>
    </section>

    <section><div className="library-heading"><ListPlus/><div><p>CURATE YOUR OWN</p><h2>Custom lists</h2></div></div>
      <form className="new-list" onSubmit={(event) => { event.preventDefault(); const name=listName.trim(); if(!name)return; void dispatch({type:"create-list",list:{id:crypto.randomUUID(),name,titles:[],position:library.lists.length,isPublic:false}}); setListName(""); }}><input aria-label="New list name" maxLength={60} value={listName} onChange={(event)=>setListName(event.target.value)} placeholder="List name"/><button><Plus/>Create list</button></form>
      <div className="custom-lists">{library.lists.map((list) => <article key={list.id}>{editing===list.id?<form onSubmit={(event)=>{event.preventDefault();const data=new FormData(event.currentTarget);void dispatch({type:"rename-list",listId:list.id,name:String(data.get("name"))});setEditing(undefined)}}><input name="name" defaultValue={list.name} maxLength={60} autoFocus/><button>Save</button></form>:<><b>{list.name}</b><span>{list.titles.length} titles · Private</span><div className="list-actions"><button onClick={()=>setEditing(list.id)}>Rename</button><button onClick={()=>void dispatch({type:"delete-list",listId:list.id})}>Delete</button></div></>}</article>)}</div>
    </section>
  </div>;
}
