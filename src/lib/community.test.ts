import{describe,expect,it}from"vitest";import{communityActionSchema}from"@/lib/community";
describe("community actions",()=>{it("validates posts and scoped reactions",()=>{expect(communityActionSchema.safeParse({type:"post",body:"Hello"}).success).toBe(true);expect(communityActionSchema.safeParse({type:"like",postId:"nope",liked:true}).success).toBe(false)})});
