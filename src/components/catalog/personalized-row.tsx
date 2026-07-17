"use client";

import Link from "next/link";
import { ArrowRight, Bookmark, Play, Sparkles, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { catalog, recommendCatalog, type Recommendation } from "@/lib/catalog";
import { useLibrary } from "@/lib/use-library";

export function PersonalizedRow() {
  const { library } = useLibrary();
  const local = useMemo(() => recommendCatalog(catalog, Array.from(new Set([...library.progress.map((item) => item.slug), ...library.favorites, ...library.watchlist])), 6), [library]);
  const [recommendations,setRecommendations]=useState<Recommendation[]>(local);
  const [personalized,setPersonalized]=useState(local.some((item)=>item.reason.startsWith("Because")));
  useEffect(()=>{void fetch("/api/v1/recommendations").then(async(response)=>response.ok?response.json():Promise.reject()).then((data:{personalized:boolean;recommendations:Recommendation[]})=>{setRecommendations(data.recommendations);setPersonalized(data.personalized)}).catch(()=>undefined)},[]);
  return <section className="content-section personalized-section">
    <div className="section-heading"><div><span className="section-icon purple"><Sparkles size={18}/></span><div><p>{personalized?"CHOSEN FROM YOUR UNIVERSE":"DISCOVER SOMETHING NEW"}</p><h2>{personalized?"Because you watched":"Popular for you"}</h2></div></div><Link href="/browse">Explore all <ArrowRight size={16}/></Link></div>
    <div className="card-grid">{recommendations.slice(0,5).map(({title,reason})=><article className="show-card recommendation-card" key={title.slug}><Link href={`/anime/${title.slug}`}><div className={`poster poster-${title.tone}`}><span className="poster-mark">{title.name.split(" ").map((part)=>part[0]).join("").slice(0,2)}</span><span className="recommendation-save"><Bookmark size={12}/></span><span className="card-play"><Play fill="currentColor" size={18}/></span></div><h3>{title.name}</h3><div className="card-meta"><span>{reason}</span><span><Star fill="currentColor" size={13}/>{title.score}</span></div></Link></article>)}</div>
  </section>;
}
