"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  CircleHelp,
  Clapperboard,
  Compass,
  Gamepad2,
  ListPlus,
  LockKeyhole,
  MessageCircle,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

type Audience = "everyone" | "viewer" | "creator" | "staff";
type GuideSection = {
  id: string;
  audience: Audience[];
  icon: typeof Compass;
  eyebrow: string;
  title: string;
  summary: string;
  steps: string[];
  href: string;
  action: string;
  keywords: string;
};

const sections: GuideSection[] = [
  { id:"discover",audience:["everyone","viewer"],icon:Compass,eyebrow:"START HERE",title:"Find your next story",summary:"Browse the catalog, search by title, or narrow results with genres, seasons, language, format, maturity rating, studio, and creator filters.",steps:["Use the search box for instant title suggestions.","Open Browse for advanced filters and seasonal charts.","Select a title to see its episodes, tracks, rating, and release details."],href:"/browse",action:"Explore Browse",keywords:"browse search autocomplete filter charts schedule studio anime title" },
  { id:"watch",audience:["everyone","viewer"],icon:Clapperboard,eyebrow:"PLAYBACK",title:"Watch your way",summary:"Control quality, speed, audio, subtitles, chapters, fullscreen, picture-in-picture, autoplay, and intro or outro skipping from the player.",steps:["Choose an episode from its title page.","Open player settings to select quality, audio, and captions.","Sign in to save progress and continue on another supported device."],href:"/history",action:"View history",keywords:"player video quality subtitles captions audio fullscreen pip speed autoplay keyboard intro outro chapters progress history" },
  { id:"library",audience:["viewer"],icon:ListPlus,eyebrow:"YOUR SPACE",title:"Create watchlists and custom lists",summary:"Keep favorites, planned titles, completion states, history, and personal collections organized in one private dashboard.",steps:["Use the list action on a title or episode.","Choose Watchlist, Favorite, or a custom list.","Open Library to move, remove, or continue an item."],href:"/library",action:"Open Library",keywords:"watchlist my list favorite custom list planned watching completed dropped continue" },
  { id:"community",audience:["viewer"],icon:MessageCircle,eyebrow:"COMMUNITY",title:"Join the conversation",summary:"Rate titles, post spoiler-aware comments, reply, react, follow creators, review profiles, block accounts, and report policy concerns.",steps:["Sign in before posting or reacting.","Mark story details as spoilers.","Use Report or Block when an interaction is unsafe or unwanted."],href:"/community",action:"Visit Community",keywords:"comments replies ratings reactions follow profile review activity block report spoiler" },
  { id:"parties",audience:["viewer"],icon:Users,eyebrow:"WATCH TOGETHER",title:"Host or join a watch party",summary:"Watch the production player in sync with friends, manage invitations and roles, and chat while the host controls playback.",steps:["Open or share a private party invitation.","Wait for connection status before starting playback.","If disconnected, allow the party to reconnect and resync with the host."],href:"/community",action:"Find party tools",keywords:"watch party invite host moderator participant realtime sync reconnect chat" },
  { id:"account",audience:["viewer"],icon:Settings,eyebrow:"ACCOUNT",title:"Control your account",summary:"Update your profile and notifications, review sessions, choose privacy and maturity settings, export data, manage backups, or delete the account.",steps:["Open Account and choose the settings area you need.","Revoke devices you do not recognize.","Reauthenticate when a sensitive action asks you to confirm identity."],href:"/account",action:"Manage account",keywords:"account profile settings privacy notifications sessions devices export backup deletion mature content" },
  { id:"creator",audience:["creator"],icon:Sparkles,eyebrow:"CREATOR STUDIO",title:"Publish original animation",summary:"Apply as a creator, manage teams, titles and episodes, upload through Mux, add artwork and languages, prepare releases, and understand performance.",steps:["Submit a creator application with rights information.","Build title metadata, episodes, artwork, tracks, subtitles, and markers.","Resolve readiness checks, submit for review, then schedule publication."],href:"/creator",action:"Open Creator Studio",keywords:"creator apply team upload mux episode artwork trailer translation audio subtitle chapter intro outro release analytics" },
  { id:"moderation",audience:["staff"],icon:ShieldCheck,eyebrow:"TRUST & SAFETY",title:"Review and protect",summary:"Authorized staff can review reports and evidence, handle appeals and takedowns, manage strikes, support users, and preserve an accountable decision history.",steps:["Verify the case, parties, evidence, and applicable policy.","Record a clear reason and apply only the permitted action.","Confirm notification, expiry, appeal, and audit follow-up."],href:"/admin",action:"Open staff dashboard",keywords:"moderator administrator reports evidence appeals takedown strikes audit support users roles" },
  { id:"security",audience:["everyone","viewer","creator","staff"],icon:LockKeyhole,eyebrow:"SECURITY",title:"Stay safe",summary:"Protect sign-in links and authentication codes, review sessions regularly, and never send passwords, provider secrets, or payment credentials through support.",steps:["Use only the newest recovery or verification link.","Enable the available second authentication factor.","Check Status before repeating an action during an incident."],href:"/account/security",action:"Review security",keywords:"security password recovery magic link mfa authentication session scam support status" },
];

const audiences: Array<{ id: Audience; label: string }> = [
  { id: "everyone", label: "Getting started" },
  { id: "viewer", label: "Viewer" },
  { id: "creator", label: "Creator" },
  { id: "staff", label: "Moderator & admin" },
];

export function WebsiteGuide() {
  const [audience, setAudience] = useState<Audience>("everyone");
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return sections.filter((section) =>
      section.audience.includes(audience) &&
      (!term || `${section.title} ${section.summary} ${section.keywords}`.toLocaleLowerCase().includes(term)),
    );
  }, [audience, query]);

  return (
    <>
      <header className="guide-hero">
        <div className="guide-orbit" aria-hidden="true"><span /><i /></div>
        <div className="guide-hero-copy">
          <p><BookOpen size={15} /> ANIVERSE WEBSITE GUIDE</p>
          <h1>Everything you need<br /><em>to enjoy the universe.</em></h1>
          <span>Simple, practical help for watching, organizing your library, joining the community, publishing stories, and managing your account.</span>
          <div className="guide-quick-actions">
            <Link href="/browse"><Gamepad2 size={17} />Start watching</Link>
            <Link href="/account"><Settings size={17} />Account settings</Link>
          </div>
        </div>
        <aside aria-label="Guide overview">
          <b>QUICK TOUR</b>
          <ol>
            <li><span>01</span>Find a title</li>
            <li><span>02</span>Choose an episode</li>
            <li><span>03</span>Save it to your list</li>
            <li><span>04</span>Continue anywhere</li>
          </ol>
        </aside>
      </header>

      <section className="guide-directory" aria-labelledby="guide-directory-title">
        <div className="guide-directory-head">
          <div><p>CHOOSE YOUR GUIDE</p><h2 id="guide-directory-title">How can we help?</h2></div>
          <label className="guide-search"><Search size={17} /><span className="sr-only">Search the website guide</span><input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Search playback, lists, privacy..." /></label>
        </div>
        <div className="guide-audiences" role="group" aria-label="Guide audience">
          {audiences.map((item)=><button className={audience===item.id?"active":""} aria-pressed={audience===item.id} key={item.id} onClick={()=>setAudience(item.id)}>{item.label}</button>)}
        </div>
        <div className="guide-card-grid" aria-live="polite">
          {visible.map((section)=>{
            const Icon=section.icon;
            return <article id={section.id} key={section.id} className="guide-card">
              <header><span><Icon size={21}/></span><p>{section.eyebrow}</p></header>
              <h3>{section.title}</h3><p>{section.summary}</p>
              <ol>{section.steps.map((step,index)=><li key={step}><b>{index+1}</b><span>{step}</span></li>)}</ol>
              <Link href={section.href}>{section.action}<ChevronRight size={15}/></Link>
            </article>;
          })}
          {!visible.length&&<div className="guide-empty"><CircleHelp/><h3>No guide matched that search.</h3><p>Try a shorter phrase or choose another user type.</p><button onClick={()=>setQuery("")}>Clear search</button></div>}
        </div>
      </section>

      <section className="guide-help-cta"><div><CircleHelp/><span><b>Couldn&apos;t find the answer?</b> Send a tracked support request or check current platform availability.</span></div><Link href="/support">Contact support</Link><Link href="/status">View status</Link></section>
    </>
  );
}
