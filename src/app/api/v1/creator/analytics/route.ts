import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { aggregatePlayback,type PlaybackEventRow } from "@/lib/playback-analytics";

export async function GET(request:Request){
  const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(!user)return Response.json({error:"Authentication required"},{status:401});
  const admin=getAdminClient();
  const[{data:owned},{data:memberships}]=await Promise.all([supabase.from("creator_teams").select("id").eq("created_by",user.id),supabase.from("creator_team_memberships").select("team_id,role").eq("user_id",user.id)]);
  const teamIds=Array.from(new Set([...(owned??[]).map((row)=>row.id as string),...(memberships??[]).filter((row)=>["owner","analyst"].includes(String(row.role))).map((row)=>row.team_id as string)]));
  if(!teamIds.length)return Response.json({error:"Creator analytics access required"},{status:403});
  const{data:titleRows}=await admin.from("titles").select("id").in("creator_team_id",teamIds);const titleIds=(titleRows??[]).map((row)=>row.id as string);if(!titleIds.length)return Response.json({analytics:{views:0,uniqueViewers:0,completionRate:0,averageWatchSeconds:0,topCountry:"—",retention:Array(12).fill(0)}});
  const range=new URL(request.url).searchParams.get("range")??"30d";const days=range==="7d"?7:range==="90d"?90:30;const since=new Date(Date.now()-days*86400000).toISOString();
  const{data,error}=await admin.from("playback_events").select("user_id,episode_id,event_type,position_seconds,duration_seconds,country_code").in("title_id",titleIds).gte("occurred_at",since);if(error)return Response.json({error:"Could not load analytics"},{status:500});
  return Response.json({analytics:aggregatePlayback((data??[]) as PlaybackEventRow[])},{headers:{"cache-control":"private, no-store"}});
}
