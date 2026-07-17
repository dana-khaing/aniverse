import { describe,expect,it } from "vitest";
import { aggregatePlayback,type PlaybackEventRow } from "./playback-analytics";
const event=(overrides:Partial<PlaybackEventRow>):PlaybackEventRow=>({user_id:"u1",episode_id:"e1",event_type:"progress",position_seconds:50,duration_seconds:100,country_code:"GB",...overrides});
describe("creator playback analytics",()=>{
  it("aggregates views, unique viewers, completion, retention, and geography",()=>{const result=aggregatePlayback([event({event_type:"start",position_seconds:0}),event({event_type:"progress"}),event({event_type:"complete",position_seconds:100}),event({user_id:"u2",event_type:"start",position_seconds:0,country_code:"JP"})]);expect(result.views).toBe(2);expect(result.uniqueViewers).toBe(2);expect(result.completionRate).toBe(50);expect(result.averageWatchSeconds).toBe(50);expect(result.topCountry).toBe("GB");expect(result.retention[0]).toBe(100)});
  it("returns safe zero metrics for an empty period",()=>{expect(aggregatePlayback([])).toMatchObject({views:0,uniqueViewers:0,completionRate:0,averageWatchSeconds:0,topCountry:"—"})});
});
