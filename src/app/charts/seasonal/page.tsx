import { PublicHeader } from "@/components/catalog/public-header";
import { TitleCard } from "@/components/catalog/title-card";
import { listCatalog } from "@/lib/catalog-repository";

export default async function SeasonalCharts(){const titles=(await listCatalog()).toSorted((a,b)=>b.score-a.score);return <><PublicHeader/><main className="catalog-page"><div className="catalog-title"><p>SUMMER 2026</p><h1>Seasonal charts</h1><span>Ranked by AniVerse community score and viewing momentum.</span></div><ol className="season-chart">{titles.map((title,index)=><li key={title.slug}><strong>#{String(index+1).padStart(2,"0")}</strong><TitleCard title={title}/><div><b>{title.score}</b><span>{title.studio} · {title.status}</span></div></li>)}</ol></main></>}
