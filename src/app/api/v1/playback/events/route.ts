import { z } from "zod";
import { consumeRateLimit } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ slug:z.string().min(1), episode:z.number().int().positive(), eventType:z.enum(["start","progress","seek","complete"]), position:z.number().int().nonnegative(), duration:z.number().int().positive() });

export async function POST(request:Request){
  const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(!user)return new Response(null,{status:204});
  if(!consumeRateLimit(`playback:${user.id}`,60,1))return Response.json({error:"Too many playback events"},{status:429});
  const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return Response.json({error:"Invalid playback event"},{status:400});
  const{data:preferences}=await supabase.from("user_preferences").select("playback_analytics_enabled").eq("user_id",user.id).maybeSingle();if(preferences?.playback_analytics_enabled===false)return new Response(null,{status:204});
  const{data:episode}=await supabase.from("episodes").select("id,seasons!inner(title_id,titles!inner(id,slug))").eq("number",parsed.data.episode).eq("seasons.titles.slug",parsed.data.slug).maybeSingle();
  const relation=episode?.seasons as unknown as {title_id:string}|undefined;if(!episode||!relation)return Response.json({error:"Episode not found"},{status:404});
  const country=request.headers.get("x-vercel-ip-country")?.toUpperCase();
  const{error}=await supabase.from("playback_events").insert({user_id:user.id,title_id:relation.title_id,episode_id:episode.id,event_type:parsed.data.eventType,position_seconds:parsed.data.position,duration_seconds:parsed.data.duration,country_code:country&&/^[A-Z]{2}$/.test(country)?country:null});
  return error?Response.json({error:"Could not record playback event"},{status:500}):new Response(null,{status:204});
}
