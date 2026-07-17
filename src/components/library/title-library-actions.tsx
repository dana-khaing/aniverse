"use client";

import { Bookmark, Check, Heart, ListPlus, Plus } from "lucide-react";
import { useState } from "react";
import { useLibrary } from "@/lib/use-library";

export function TitleLibraryActions({ slug, compact=false }: { slug:string; compact?:boolean }) {
  const { library, dispatch } = useLibrary();
  const [open,setOpen]=useState(false);
  const saved=library.watchlist.includes(slug), favorite=library.favorites.includes(slug);
  return <div className={`title-library-actions ${compact?"compact":""}`}>
    <button className={saved?"active":""} onClick={()=>void dispatch({type:"toggle-watchlist",slug})}><Bookmark fill={saved?"currentColor":"none"}/>{saved?"In Watchlist":"Watchlist"}</button>
    <button className={favorite?"active":""} onClick={()=>void dispatch({type:"toggle-favorite",slug})}><Heart fill={favorite?"currentColor":"none"}/>{favorite?"Favorited":"Favorite"}</button>
    <button onClick={()=>setOpen(!open)}><ListPlus/>Add to list</button>
    {open&&<div className="list-picker" role="dialog" aria-label="Add title to a list"><b>Add to a custom list</b>{library.lists.map((list)=>{const added=list.titles.includes(slug);return <button key={list.id} disabled={added} onClick={()=>{void dispatch({type:"add-to-list",listId:list.id,slug});setOpen(false)}}>{added?<Check/>:<Plus/>}{list.name}</button>})}{!library.lists.length&&<span>Create a list in My Library first.</span>}<button className="picker-close" onClick={()=>setOpen(false)}>Close</button></div>}
  </div>;
}
