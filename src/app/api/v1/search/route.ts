import { searchCatalog } from "@/lib/catalog";
export function GET(request:Request){const url=new URL(request.url);const q=url.searchParams.get("q")??"";return Response.json({data:searchCatalog(q).slice(0,8).map(({slug,name,nativeName,genre,year})=>({slug,name,nativeName,genre,year})),meta:{query:q}})}
