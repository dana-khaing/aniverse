import Link from "next/link";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export default function AdminPage(){return <main className="admin-shell"><nav><Link className="brand" href="/"><span className="brand-orbit"><span/></span><span>Ani<span>Verse</span></span></Link><Link href="/admin">Overview</Link><Link href="/admin/creators">Creators</Link><Link href="/community">Community</Link></nav><AdminDashboard/></main>}
