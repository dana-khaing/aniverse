import Link from "next/link";
import { Bell, ChevronRight, Heart, History, Settings, ShieldCheck, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function AccountPage() {
  let email = "Connect Supabase to load your account"; let name = "AniVerse viewer";
  try { const { data } = await (await createClient()).auth.getUser(); if (data.user) { email = data.user.email ?? email; name = String(data.user.user_metadata.display_name ?? email.split("@")[0]); } } catch { /* Setup state is intentionally renderable. */ }
  const links = [
    { href: "/account/profile", label: "Profile & appearance", icon: UserRound },
    { href: "/account/notifications", label: "Notification preferences", icon: Bell },
    { href: "/account/security", label: "Password & security", icon: ShieldCheck },
    { href: "/history", label: "Watch history", icon: History },
    { href: "/my-list", label: "My lists", icon: Heart },
    { href: "/account/settings", label: "Account settings", icon: Settings },
  ];
  return <main className="account-page"><header><Link className="auth-brand" href="/"><span className="brand-orbit"><span/></span><strong>Ani<span>Verse</span></strong></Link></header><section className="account-wrap"><div className="profile-summary"><div className="profile-avatar">{name.slice(0,2).toUpperCase()}</div><div><p>YOUR ACCOUNT</p><h1>{name}</h1><span>{email}</span></div><b>VIEWER</b></div><div className="account-grid">{links.map(({href,label,icon:Icon})=><Link href={href} key={href}><Icon size={19}/><span>{label}</span><ChevronRight size={16}/></Link>)}</div><div className="creator-callout"><div><p>SHARE YOUR UNIVERSE</p><h2>Are you an animation creator?</h2><span>Apply for a verified creator profile and publish your original work.</span></div><Link href="/creator/apply">Apply to create</Link></div></section></main>;
}
