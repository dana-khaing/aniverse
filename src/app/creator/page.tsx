import { CreatorWorkspace } from "@/components/creator/creator-workspace";
import { CreatorConnect } from "@/components/payments/creator-connect";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export default async function CreatorPage() {
  let team:{id:string;name:string;details:boolean;charges:boolean;payouts:boolean}|undefined;
  if(isSupabaseConfigured()&&process.env.STRIPE_SECRET_KEY){const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(user){const{data}=await supabase.from("creator_teams").select("id,name,stripe_details_submitted,stripe_charges_enabled,stripe_payouts_enabled").eq("created_by",user.id).limit(1).maybeSingle();if(data)team={id:data.id,name:data.name,details:data.stripe_details_submitted,charges:data.stripe_charges_enabled,payouts:data.stripe_payouts_enabled}}}
  return <><CreatorWorkspace />{team&&<CreatorConnect team={team}/>}</>;
}
