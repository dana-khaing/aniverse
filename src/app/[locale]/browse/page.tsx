import { redirect } from "next/navigation";export default async function LocaleBrowse({params}:{params:Promise<{locale:string}>}){const {locale}=await params;redirect(`/browse?locale=${locale}`)}
