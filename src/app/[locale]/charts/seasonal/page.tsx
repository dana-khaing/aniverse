import { notFound } from "next/navigation";
import { PublicHeader } from "@/components/catalog/public-header";
import { TitleCard } from "@/components/catalog/title-card";
import { AniListTrending } from "@/components/catalog/anilist-trending";
import { listCatalog } from "@/lib/catalog-repository";
import { isLocale } from "@/lib/i18n";

export default async function LocalizedSeasonalCharts({ params }: { params:Promise<{locale:string}> }) {
  const {locale}=await params; if(!isLocale(locale))notFound();
  const copy=locale==="ja"?{season:"2026年 夏",title:"シーズンランキング",summary:"AniVerseコミュニティの評価と視聴動向によるランキング。"}:{season:"SUMMER 2026",title:"Seasonal charts",summary:"Ranked by AniVerse community score and viewing momentum."};
  const titles=(await listCatalog()).toSorted((a,b)=>b.score-a.score);
  return <><PublicHeader locale={locale} path="/charts/seasonal"/><main className="catalog-page" lang={locale}><div className="catalog-title"><p>{copy.season}</p><h1>{copy.title}</h1><span>{copy.summary}</span></div><ol className="season-chart">{titles.map((title,index)=><li key={title.slug}><strong>#{String(index+1).padStart(2,"0")}</strong><TitleCard title={{...title,name:locale==="ja"?title.nativeName:title.name}}/><div><b>{title.score}</b><span>{title.studio} · {title.status}</span></div></li>)}</ol><AniListTrending/></main></>;
}
