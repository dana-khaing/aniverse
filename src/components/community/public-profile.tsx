"use client";

import { useEffect, useState } from "react";
import { Award, LoaderCircle, MessageCircle, Star, Trophy, UserCheck, UserPlus } from "lucide-react";
import { useLocalDemoState } from "@/lib/local-demo";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { ProfileReview } from "@/lib/public-profile";

const localReviews: ProfileReview[] = [{ id: "rv1", title: "Echoes of Asteria", body: "A gorgeous story about memory, maps, and chosen family.", score: 9 }];
const localAchievements = [{ name: "Season Pioneer", detail: "Watched 5 premieres" }, { name: "Story Curator", detail: "Created 10 lists" }, { name: "Trusted Reviewer", detail: "25 helpful votes" }];
type Profile = { username: string; name: string; bio: string; watched: number; followers: number; followed: boolean; ownProfile: boolean; authenticated: boolean };

export function PublicProfile({ username = "dana" }: { username?: string }) {
  const [reviews, setReviews] = useLocalDemoState<ProfileReview[]>("aniverse.profile-reviews", localReviews);
  const [profile, setProfile] = useState<Profile>({ username: "dana", name: "Dana Lewis", bio: "Animation explorer", watched: 128, followers: 42, followed: false, ownProfile: true, authenticated: true });
  const [achievements, setAchievements] = useState(localAchievements);
  const [activity, setActivity] = useState(["Completed Echoes of Asteria episode 12", "Earned Season Pioneer", "Added Skybound to Weekend watch"]);
  const [body, setBody] = useState(""); const [title, setTitle] = useState(""); const [score, setScore] = useState(8);
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const cloud = isSupabaseConfigured();

  useEffect(() => { if (!cloud) return; const timer = setTimeout(() => { setBusy(true); void fetch(`/api/v1/profiles/${encodeURIComponent(username)}`, { cache: "no-store" }).then(async (response) => response.ok ? response.json() : Promise.reject()).then((data: { profile: Profile; reviews: ProfileReview[]; achievements: typeof achievements; activity: string[] }) => { setProfile(data.profile); setReviews(data.reviews); setAchievements(data.achievements); setActivity(data.activity); }).catch(() => setError("This profile is unavailable.")).finally(() => setBusy(false)); }, 0); return () => clearTimeout(timer); }, [cloud, username, setReviews]);

  async function toggleFollow() {
    if (!profile.authenticated) { setError("Sign in to follow this profile."); return; }
    const followed = !profile.followed; setBusy(true); setError("");
    const response = await fetch(`/api/v1/profiles/${encodeURIComponent(username)}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ followed }) });
    const data = await response.json().catch(() => ({})) as { error?: string };
    if (response.ok) setProfile((current) => ({ ...current, followed, followers: Math.max(0, current.followers + (followed ? 1 : -1)) }));
    else setError(data.error ?? "Follow could not be saved."); setBusy(false);
  }

  async function publish(event: React.FormEvent) {
    event.preventDefault(); if (body.trim().length < 20 || !title.trim()) return; setBusy(true);
    if (cloud) { const response = await fetch(`/api/v1/profiles/${encodeURIComponent(username)}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title, body, score }) }); const data = await response.json().catch(() => ({})) as { review?: ProfileReview; error?: string }; if (response.ok && data.review) setReviews((current) => [data.review!, ...current]); else setError(data.error ?? "Review could not be published."); }
    else setReviews((current) => [{ id: crypto.randomUUID(), title, body, score }, ...current]);
    setBody(""); setTitle(""); setBusy(false);
  }

  return <main className="profile-page"><header><span className="profile-avatar">{profile.name.slice(0, 1)}</span><div><p>@{profile.username}</p><h1>{profile.name}</h1><span>{profile.bio} · {profile.watched} episodes completed · {profile.followers} followers</span></div>{busy ? <LoaderCircle className="spin" /> : !profile.ownProfile && <button aria-pressed={profile.followed} onClick={() => void toggleFollow()}>{profile.followed ? <UserCheck /> : <UserPlus />}{profile.followed ? "Following" : "Follow"}</button>}</header>{error && <p className="form-error" role="alert">{error}</p>}<section className="badge-grid">{achievements.map((item, index) => { const Icon = [Trophy, Award, Star][index % 3]; return <article key={item.name}><Icon /><b>{item.name}</b><span>{item.detail}</span></article>; })}</section><section className="profile-columns"><div><h2>Reviews</h2>{profile.ownProfile && <form onSubmit={(event) => void publish(event)}><input aria-label="Review title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title reviewed" /><select aria-label="Review score" value={score} onChange={(event) => setScore(Number(event.target.value))}>{[10,9,8,7,6,5,4,3,2,1].map((value) => <option key={value}>{value}</option>)}</select><textarea minLength={20} aria-label="Write a review" value={body} onChange={(event) => setBody(event.target.value)} placeholder="Share a spoiler-free review" /><button disabled={busy}><MessageCircle />Publish review</button></form>}{reviews.map((review) => <article className="review-card" key={review.id}><b>{review.title}</b><span>{review.score}/10</span><p>{review.body}</p></article>)}</div><aside><h2>Recent activity</h2>{activity.length ? activity.map((item, index) => <p key={`${item}-${index}`}>{item}</p>) : <p>No public activity yet.</p>}</aside></section></main>;
}
