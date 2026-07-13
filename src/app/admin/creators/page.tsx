import Link from "next/link";
import { CreatorQueue } from "@/components/admin/creator-queue";

export default function AdminCreatorsPage(){return <main className="admin-shell"><nav><Link className="brand" href="/"><span className="brand-orbit"><span/></span><span>Ani<span>Verse</span></span></Link><Link href="/creator/apply">Creator application</Link><Link href="/creator">Creator studio</Link></nav><CreatorQueue/></main>}
