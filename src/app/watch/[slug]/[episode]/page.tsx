import { notFound } from "next/navigation";
import { LocalPlayer } from "@/components/player/local-player";
import { getTitle } from "@/lib/catalog-repository";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export default async function WatchPage({params}:{params:Promise<{slug:string;episode:string}>}){const {slug,episode:episodeParam}=await params;const title=await getTitle(slug);const episode=Number(episodeParam);if(!title||!Number.isInteger(episode)||episode<1||episode>title.episodes)notFound();let managedEpisodeId:string|undefined;if(isSupabaseConfigured()){const supabase=await createClient();const {data}=await supabase.from("episodes").select("id,seasons!inner(titles!inner(slug))").eq("number",episode).eq("seasons.titles.slug",slug).maybeSingle();managedEpisodeId=data?.id;}return <LocalPlayer slug={slug} title={title.name} episode={episode} totalEpisodes={title.episodes} managedEpisodeId={managedEpisodeId}/>}
