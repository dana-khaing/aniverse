export type CatalogTitle = { slug:string; name:string; nativeName:string; synopsis:string; genre:string[]; year:number; score:number; episodes:number; format:"TV"|"Movie"; tone:string; studio:string; status:string };

export const catalog: CatalogTitle[] = [
  {slug:"echoes-of-asteria",name:"Echoes of Asteria",nativeName:"アステリアの残響",synopsis:"When the stars begin to disappear, a young cartographer discovers that her forgotten memories may be the key to saving two worlds.",genre:["Fantasy","Adventure","Drama"],year:2026,score:9.2,episodes:12,format:"TV",tone:"violet",studio:"Lumen Works",status:"Airing"},
  {slug:"neon-ronin",name:"Neon Ronin",nativeName:"ネオン浪人",synopsis:"A masterless swordsman hunts corrupted memories through the rain-lit streets of a city that never sleeps.",genre:["Sci-fi","Action"],year:2026,score:8.9,episodes:8,format:"TV",tone:"cyan",studio:"Voltage Frame",status:"Airing"},
  {slug:"paper-moons",name:"Paper Moons",nativeName:"紙の月",synopsis:"Two childhood friends exchange letters with their future selves and slowly rewrite the summer that separated them.",genre:["Drama","Romance"],year:2026,score:8.7,episodes:6,format:"TV",tone:"rose",studio:"Mallow Pictures",status:"Airing"},
  {slug:"skybound",name:"Skybound",nativeName:"空へ",synopsis:"A rookie airship crew maps the storm wall at the edge of the world while an ancient engine wakes below deck.",genre:["Adventure","Fantasy"],year:2025,score:9.0,episodes:18,format:"TV",tone:"blue",studio:"Northwind",status:"Airing"},
  {slug:"the-last-alchemist",name:"The Last Alchemist",nativeName:"最後の錬金術師",synopsis:"The final keeper of a forbidden craft must solve a royal murder before her own order is erased from history.",genre:["Mystery","Fantasy"],year:2025,score:8.8,episodes:10,format:"TV",tone:"amber",studio:"Brass Lantern",status:"Finished"},
  {slug:"garden-of-spirits",name:"Garden of Spirits",nativeName:"精霊の庭",synopsis:"A quiet gardener can hear the wishes of forgotten spirits, but granting the last wish may cost her every memory.",genre:["Supernatural","Drama"],year:2026,score:8.6,episodes:4,format:"TV",tone:"emerald",studio:"Mosslight",status:"Airing"},
];

export function searchCatalog(query="", genre="all") { const q=query.trim().toLowerCase(); return catalog.filter(t=>(!q||`${t.name} ${t.nativeName} ${t.synopsis} ${t.genre.join(" ")}`.toLowerCase().includes(q))&&(genre==="all"||t.genre.some(g=>g.toLowerCase()===genre.toLowerCase()))); }
export function getTitle(slug:string){return catalog.find(t=>t.slug===slug);}
