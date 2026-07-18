import {z}from"zod";
export const communityActionSchema=z.discriminatedUnion("type",[
 z.object({type:z.literal("post"),body:z.string().trim().min(1).max(2000)}),
 z.object({type:z.literal("reply"),postId:z.string().uuid(),body:z.string().trim().min(1).max(2000)}),
 z.object({type:z.literal("like"),postId:z.string().uuid(),liked:z.boolean()}),
 z.object({type:z.literal("read-notifications")}),
]);
export type CloudCommunityPost={id:string;author:string;title:string;body:string;likes:number;liked:boolean;replies:string[]};
