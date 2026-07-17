export type PlaybackEventRow={user_id:string|null;episode_id:string|null;event_type:"start"|"progress"|"seek"|"complete";position_seconds:number;duration_seconds:number;country_code:string|null};
export function aggregatePlayback(events:PlaybackEventRow[]){
  const starts=events.filter((event)=>event.event_type==="start").length;const completions=events.filter((event)=>event.event_type==="complete").length;const viewers=new Set(events.flatMap((event)=>event.user_id?[event.user_id]:[]));
  const sessions=new Map<string,number>();for(const event of events){const key=`${event.user_id}:${event.episode_id}`;sessions.set(key,Math.max(sessions.get(key)??0,event.position_seconds));}
  const averageWatchSeconds=sessions.size?Math.round([...sessions.values()].reduce((sum,value)=>sum+value,0)/sessions.size):0;const countries=new Map<string,number>();for(const event of events)if(event.country_code)countries.set(event.country_code,(countries.get(event.country_code)??0)+1);const topCountry=[...countries].toSorted((a,b)=>b[1]-a[1])[0]?.[0]??"—";
  const retention=Array.from({length:12},(_,index)=>{const threshold=index/12;const relevant=events.filter((event)=>event.duration_seconds>0&&event.event_type!=="seek");if(!relevant.length)return 0;return Math.round(relevant.filter((event)=>event.position_seconds/event.duration_seconds>=threshold).length/relevant.length*100)});
  return{views:starts,uniqueViewers:viewers.size,completionRate:starts?Math.min(100,Math.round(completions/starts*100)):0,averageWatchSeconds,topCountry,retention};
}
