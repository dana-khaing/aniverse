import { listCatalog } from "@/lib/catalog-repository";
import { recommendCatalog } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const titles = await listCatalog();
  const popular = () => recommendCatalog(titles, [], 6);
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ personalized: false, recommendations: popular() });
  const { data: preferences } = await supabase.from("user_preferences").select("personalization_enabled").eq("user_id", user.id).maybeSingle();
  if (preferences?.personalization_enabled === false) return Response.json({ personalized: false, recommendations: popular() });
  const [progress, favorites, watchlist] = await Promise.all([
    supabase.from("watch_progress").select("episodes(seasons(titles(slug)))").eq("user_id", user.id),
    supabase.from("favorites").select("titles(slug)").eq("user_id", user.id),
    supabase.from("watchlist_items").select("titles(slug)").eq("user_id", user.id),
  ]);
  const watched = new Set<string>();
  for (const row of (progress.data ?? []) as unknown as Array<{episodes:{seasons:{titles:{slug:string}}}}>) watched.add(row.episodes.seasons.titles.slug);
  for (const row of [...(favorites.data ?? []), ...(watchlist.data ?? [])] as unknown as Array<{titles:{slug:string}}>) watched.add(row.titles.slug);
  return Response.json({ personalized: watched.size > 0, recommendations: recommendCatalog(titles, [...watched], 6) }, { headers: { "cache-control": "private, no-store" } });
}
