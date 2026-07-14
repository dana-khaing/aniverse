import { notFound } from "next/navigation";
import { PublicHeader } from "@/components/catalog/public-header";
import { TitleCard } from "@/components/catalog/title-card";
import { listCatalog } from "@/lib/catalog-repository";

export default async function StudioPage({params}:{params:Promise<{studio:string}>}){const {studio}=await params;const name=decodeURIComponent(studio);const titles=(await listCatalog()).filter((title)=>title.studio.toLowerCase()===name.toLowerCase());if(!titles.length)notFound();return <><PublicHeader/><main className="catalog-page"><div className="catalog-title"><p>STUDIO SPOTLIGHT</p><h1>{titles[0].studio}</h1><span>{titles.length} creator-owned {titles.length===1?"title":"titles"} on AniVerse.</span></div><section className="catalog-grid studio-grid">{titles.map((title)=><TitleCard key={title.slug} title={title}/>)}</section></main></>}
