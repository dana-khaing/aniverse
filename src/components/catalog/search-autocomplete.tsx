"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import type { SearchSuggestion } from "@/lib/catalog";

export function SearchAutocomplete({ defaultValue = "" }: { defaultValue?: string }) {
  const [query,setQuery]=useState(defaultValue); const [suggestions,setSuggestions]=useState<SearchSuggestion[]>([]);
  useEffect(()=>{if(query.trim().length<2)return;const controller=new AbortController();const timer=setTimeout(()=>{fetch(`/api/v1/search?q=${encodeURIComponent(query)}`,{signal:controller.signal}).then((response)=>response.json()).then((payload:{data:SearchSuggestion[]})=>setSuggestions(payload.data)).catch(()=>undefined);},150);return()=>{clearTimeout(timer);controller.abort();};},[query]);
  const visibleSuggestions=query.trim().length>=2?suggestions:[];
  return <div className="autocomplete"><label><Search size={18}/><input name="q" value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Search titles, studios, genres..." autoComplete="off"/></label>{visibleSuggestions.length>0&&<div className="suggestions" role="listbox">{visibleSuggestions.map((item)=><Link key={item.slug} href={`/anime/${item.slug}`}><b>{item.name}</b><span>{item.nativeName} · {item.studio}</span></Link>)}</div>}</div>;
}
