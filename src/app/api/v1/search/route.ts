import { searchCatalog } from "@/lib/catalog-repository";
export async function GET(request:Request){const url=new URL(request.url);const q=url.searchParams.get("q")??"";const results=await searchCatalog(q);return Response.json({data:results.slice(0,8).map(({slug,name,nativeName,genre,year,studio,tone})=>({slug,name,nativeName,genre,year,studio,tone})),meta:{query:q}})}
