"use client";

import Link from "next/link";
import { Search, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import type { DiscoverySuggestion, SearchSuggestion } from "@/lib/catalog";
import { localePath, type Locale } from "@/lib/i18n";

type Result =
  | { kind: "local"; value: SearchSuggestion }
  | { kind: "discovery"; value: DiscoverySuggestion };
type SearchPayload = { data: SearchSuggestion[]; discovery: DiscoverySuggestion[]; meta: { discoveryAvailable: boolean } };

const copy = {
  en: { label:"Search anime",placeholder:"Search anime…",playable:"Watch on AniVerse",discovery:"Discover via Kitsu",empty:"No anime found",unavailable:"Kitsu discovery is temporarily unavailable",close:"Close search" },
  ja: { label:"アニメを検索",placeholder:"アニメを検索…",playable:"AniVerseで視聴",discovery:"Kitsuで見つける",empty:"作品が見つかりません",unavailable:"Kitsuの検索は一時的に利用できません",close:"検索を閉じる" },
} as const;

export function HeaderSearch({ locale, open, onOpen, onClose }: { locale:Locale; open:boolean; onOpen:(trigger?:HTMLElement)=>void; onClose:()=>void }) {
  const labels=copy[locale]; const listboxId=useId(); const inputRef=useRef<HTMLInputElement>(null);
  const [query,setQuery]=useState(""); const [results,setResults]=useState<Result[]>([]); const [loading,setLoading]=useState(false); const [searched,setSearched]=useState(false); const [discoveryAvailable,setDiscoveryAvailable]=useState(true); const [activeIndex,setActiveIndex]=useState(-1);

  useEffect(()=>{if(open)inputRef.current?.focus()},[open]);
  useEffect(()=>{
    const trimmed=query.trim();
    if(trimmed.length<2)return;
    const controller=new AbortController();
    const timer=window.setTimeout(async()=>{
      setLoading(true);
      try{
        const response=await fetch(`/api/v1/search?q=${encodeURIComponent(trimmed)}`,{signal:controller.signal});
        if(!response.ok)throw new Error(`Search failed: ${response.status}`);
        const payload=(await response.json()) as SearchPayload;
        setResults([...payload.data.slice(0,5).map(value=>({kind:"local" as const,value})),...payload.discovery.slice(0,5).map(value=>({kind:"discovery" as const,value}))]);
        setDiscoveryAvailable(payload.meta.discoveryAvailable);setSearched(true);setActiveIndex(-1);
      }catch(error){if((error as Error).name!=="AbortError"){setResults([]);setSearched(true);setDiscoveryAvailable(false)}}
      finally{if(!controller.signal.aborted)setLoading(false)}
    },200);
    return()=>{window.clearTimeout(timer);controller.abort()};
  },[query]);

  const showPanel=query.trim().length>=2&&(loading||searched);
  const hrefFor=(result:Result)=>result.kind==="local"?`/anime/${result.value.slug}`:localePath(locale,`/discover/kitsu/${result.value.id}`);
  function onKeyDown(event:KeyboardEvent<HTMLInputElement>){
    if(event.key==="Escape"){onClose();return} if(!results.length)return;
    if(event.key==="ArrowDown"){event.preventDefault();setActiveIndex(current=>(current+1)%results.length)}
    else if(event.key==="ArrowUp"){event.preventDefault();setActiveIndex(current=>current<=0?results.length-1:current-1)}
    else if(event.key==="Enter"&&activeIndex>=0){event.preventDefault();window.location.assign(hrefFor(results[activeIndex]))}
  }

  function onQueryChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      setActiveIndex(-1);
    }
  }

  function renderResult(result: Result, index: number) {
    const isLocal = result.kind === "local";
    const title = isLocal ? result.value.name : result.value.title;
    const nativeTitle = isLocal
      ? result.value.nativeName
      : result.value.nativeTitle;
    const key = isLocal ? `local-${result.value.slug}` : `discovery-${result.value.id}`;
    return <Link id={`${listboxId}-${index}`} role="option" aria-selected={index===activeIndex} key={key} href={hrefFor(result)} onMouseEnter={()=>setActiveIndex(index)} onClick={onClose}><span><b>{title}</b><small>{nativeTitle}</small></span><i>{isLocal?labels.playable:labels.discovery}</i></Link>;
  }

  return <div className={`header-search${open?" open":""}`}>
    <button className="header-search-toggle" aria-label={labels.label} onClick={event=>onOpen(event.currentTarget)}><Search size={18}/></button>
    <div className="header-search-field"><Search size={17} aria-hidden="true"/><input ref={inputRef} role="combobox" aria-label={labels.label} aria-expanded={showPanel} aria-controls={listboxId} aria-activedescendant={activeIndex>=0?`${listboxId}-${activeIndex}`:undefined} value={query} onChange={onQueryChange} onFocus={()=>onOpen()} onKeyDown={onKeyDown} placeholder={labels.placeholder} autoComplete="off"/><button className="header-search-close" aria-label={labels.close} onClick={onClose}><X size={17}/></button></div>
    {showPanel&&<div className="header-search-results" id={listboxId} role="listbox">
      {loading&&<p role="status">Searching…</p>}{!loading&&results.length===0&&<p>{labels.empty}</p>}
      {!loading&&results.map(renderResult)}
      {!loading&&results.length>0&&!discoveryAvailable&&<p className="search-provider-note">{labels.unavailable}</p>}
    </div>}
  </div>;
}
