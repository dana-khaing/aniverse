import { notFound } from "next/navigation";
import { LocalPlayer } from "@/components/player/local-player";
import { getTitle } from "@/lib/catalog-repository";

export default async function WatchPage({params}:{params:Promise<{slug:string;episode:string}>}){const {slug,episode:episodeParam}=await params;const title=await getTitle(slug);const episode=Number(episodeParam);if(!title||!Number.isInteger(episode)||episode<1||episode>title.episodes)notFound();return <LocalPlayer slug={slug} title={title.name} episode={episode} totalEpisodes={title.episodes}/>}
