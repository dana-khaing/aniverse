import {z}from"zod";
export const communityActionSchema=z.discriminatedUnion("type",[
 z.object({type:z.literal("post"),body:z.string().trim().min(1).max(2000)}),
 z.object({type:z.literal("reply"),postId:z.string().uuid(),body:z.string().trim().min(1).max(2000)}),
 z.object({type:z.literal("like"),postId:z.string().uuid(),liked:z.boolean()}),
 z.object({type:z.literal("read-notifications")}),
 z.object({type:z.literal("follow-featured"),followed:z.boolean()}),
 z.object({type:z.literal("report"),postId:z.string().uuid(),reason:z.enum(["spam","harassment","spoilers","unsafe_content","other"]),details:z.string().trim().min(10).max(2000)}),
]);
export type CloudCommunityPost={id:string;author:string;title:string;body:string;likes:number;liked:boolean;replies:string[]};
