import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { mergeLibraries, normalizeLibrary, type LibraryAction, type LibrarySnapshot } from "@/lib/library";

const progressSchema = z.object({ slug: z.string().min(1), title: z.string().min(1), episode: z.number().int().positive(), position: z.number().int().nonnegative(), duration: z.number().int().positive(), watchedAt: z.string(), completed: z.boolean().optional() });
const actionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("toggle-watchlist"), slug: z.string().min(1) }),
  z.object({ type: z.literal("toggle-favorite"), slug: z.string().min(1) }),
  z.object({ type: z.literal("save-progress"), progress: progressSchema }),
  z.object({ type: z.literal("remove-history"), slug: z.string().min(1), episode: z.number().int().positive() }),
  z.object({ type: z.literal("create-list"), list: z.object({ id: z.string(), name: z.string().trim().min(1).max(60), titles: z.array(z.string()), position: z.number().int().nonnegative(), isPublic: z.boolean() }) }),
  z.object({ type: z.literal("rename-list"), listId: z.uuid(), name: z.string().trim().min(1).max(60) }),
  z.object({ type: z.literal("delete-list"), listId: z.uuid() }),
  z.object({ type: z.literal("add-to-list"), listId: z.uuid(), slug: z.string().min(1) }),
  z.object({ type: z.literal("remove-from-list"), listId: z.uuid(), slug: z.string().min(1) }),
]);

async function identity() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

async function loadLibrary(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<LibrarySnapshot> {
  const [progress, favorites, watchlist, lists] = await Promise.all([
    supabase.from("watch_progress").select("position_seconds,duration_seconds,completed,last_watched_at,episodes(number,seasons(titles(slug,name)))").eq("user_id", userId).order("last_watched_at", { ascending: false }),
    supabase.from("favorites").select("titles(slug)").eq("user_id", userId),
    supabase.from("watchlist_items").select("position,titles(slug)").eq("user_id", userId).order("position"),
    supabase.from("custom_lists").select("id,name,is_public,position,custom_list_items(position,titles(slug))").eq("user_id", userId).order("position"),
  ]);
  const failed = [progress, favorites, watchlist, lists].find(({ error }) => error);
  if (failed?.error) throw failed.error;
  const p = (progress.data ?? []) as unknown as Array<{ position_seconds:number;duration_seconds:number;completed:boolean;last_watched_at:string;episodes:{number:number;seasons:{titles:{slug:string;name:string}}} }>;
  const f = (favorites.data ?? []) as unknown as Array<{ titles:{slug:string} }>;
  const w = (watchlist.data ?? []) as unknown as Array<{ titles:{slug:string} }>;
  const l = (lists.data ?? []) as unknown as Array<{id:string;name:string;is_public:boolean;position:number;custom_list_items:Array<{position:number;titles:{slug:string}}>}>;
  return normalizeLibrary({
    progress: p.map((row) => ({ slug: row.episodes.seasons.titles.slug, title: row.episodes.seasons.titles.name, episode: Number(row.episodes.number), position: row.position_seconds, duration: row.duration_seconds, watchedAt: row.last_watched_at, completed: row.completed })),
    favorites: f.map((row) => row.titles.slug),
    watchlist: w.map((row) => row.titles.slug),
    lists: l.map((row) => ({ id: row.id, name: row.name, isPublic: row.is_public, position: row.position, titles: row.custom_list_items.toSorted((a,b) => a.position-b.position).map((item) => item.titles.slug) })),
  });
}

async function titleId(supabase: Awaited<ReturnType<typeof createClient>>, slug: string) {
  const { data } = await supabase.from("titles").select("id").eq("slug", slug).maybeSingle();
  return data?.id as string | undefined;
}

async function episodeId(supabase: Awaited<ReturnType<typeof createClient>>, slug: string, episode: number) {
  const { data } = await supabase.from("episodes").select("id,seasons!inner(titles!inner(slug))").eq("number", episode).eq("seasons.titles.slug", slug).maybeSingle();
  return data?.id as string | undefined;
}

export async function GET() {
  const { supabase, user } = await identity();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  try { return Response.json({ library: await loadLibrary(supabase, user.id) }, { headers: { "cache-control": "private, no-store" } }); }
  catch { return Response.json({ error: "Could not load library" }, { status: 500 }); }
}

export async function PUT(request: Request) {
  const { supabase, user } = await identity();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  const body = await request.json().catch(() => null) as { library?: LibrarySnapshot } | null;
  if (!body?.library) return Response.json({ error: "Library is required" }, { status: 400 });
  const cloud = await loadLibrary(supabase, user.id);
  const merged = mergeLibraries(cloud, normalizeLibrary(body.library));
  const { data: titleRows } = await supabase.from("titles").select("id,slug").in("slug", Array.from(new Set([...merged.favorites, ...merged.watchlist, ...merged.lists.flatMap((list) => list.titles), ...merged.progress.map((item) => item.slug)])));
  const ids = new Map((titleRows ?? []).map((row) => [row.slug as string, row.id as string]));
  if (merged.favorites.length) await supabase.from("favorites").upsert(merged.favorites.flatMap((slug) => ids.has(slug) ? [{ user_id: user.id, title_id: ids.get(slug)! }] : []));
  if (merged.watchlist.length) await supabase.from("watchlist_items").upsert(merged.watchlist.flatMap((slug, position) => ids.has(slug) ? [{ user_id: user.id, title_id: ids.get(slug)!, position }] : []));
  for (const item of merged.progress) {
    const id = await episodeId(supabase, item.slug, item.episode);
    if (id) await supabase.from("watch_progress").upsert({ user_id: user.id, episode_id: id, position_seconds: item.position, duration_seconds: item.duration, completed: item.completed ?? item.position / item.duration >= .9, last_watched_at: item.watchedAt });
  }
  for (const [position, list] of merged.lists.entries()) {
    const cloudList = cloud.lists.find((item) => item.name.toLocaleLowerCase() === list.name.toLocaleLowerCase());
    let listId = cloudList?.id;
    if (!listId) {
      const { data } = await supabase.from("custom_lists").insert({ user_id: user.id, name: list.name, is_public: list.isPublic, position }).select("id").single();
      listId = data?.id;
    }
    if (listId) await supabase.from("custom_list_items").upsert(list.titles.flatMap((slug, itemPosition) => ids.has(slug) ? [{ list_id: listId, title_id: ids.get(slug)!, position: itemPosition }] : []));
  }
  return Response.json({ library: await loadLibrary(supabase, user.id) });
}

export async function POST(request: Request) {
  const { supabase, user } = await identity();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid library action" }, { status: 400 });
  const action = parsed.data as LibraryAction;
  if (action.type === "toggle-watchlist" || action.type === "toggle-favorite") {
    const id = await titleId(supabase, action.slug); if (!id) return Response.json({ error: "Title not found" }, { status: 404 });
    const table = action.type === "toggle-watchlist" ? "watchlist_items" : "favorites";
    const { data } = await supabase.from(table).select("title_id").eq("user_id", user.id).eq("title_id", id).maybeSingle();
    if (data) await supabase.from(table).delete().eq("user_id", user.id).eq("title_id", id);
    else await supabase.from(table).insert({ user_id: user.id, title_id: id });
  } else if (action.type === "save-progress") {
    const id = await episodeId(supabase, action.progress.slug, action.progress.episode); if (!id) return Response.json({ error: "Episode not found" }, { status: 404 });
    await supabase.from("watch_progress").upsert({ user_id: user.id, episode_id: id, position_seconds: action.progress.position, duration_seconds: action.progress.duration, completed: action.progress.completed ?? action.progress.position / action.progress.duration >= .9, last_watched_at: action.progress.watchedAt });
  } else if (action.type === "remove-history") {
    const id = await episodeId(supabase, action.slug, action.episode); if (id) await supabase.from("watch_progress").delete().eq("user_id", user.id).eq("episode_id", id);
  } else if (action.type === "create-list") {
    await supabase.from("custom_lists").insert({ user_id: user.id, name: action.list.name, is_public: action.list.isPublic, position: action.list.position });
  } else if (action.type === "rename-list") await supabase.from("custom_lists").update({ name: action.name, updated_at: new Date().toISOString() }).eq("id", action.listId).eq("user_id", user.id);
  else if (action.type === "delete-list") await supabase.from("custom_lists").delete().eq("id", action.listId).eq("user_id", user.id);
  else {
    const id = await titleId(supabase, action.slug); if (!id) return Response.json({ error: "Title not found" }, { status: 404 });
    if (action.type === "add-to-list") await supabase.from("custom_list_items").upsert({ list_id: action.listId, title_id: id });
    else await supabase.from("custom_list_items").delete().eq("list_id", action.listId).eq("title_id", id);
  }
  return Response.json({ library: await loadLibrary(supabase, user.id) });
}
