"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowRight, Globe2, LoaderCircle, LockKeyhole, Mail, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Mode = "sign-in" | "sign-up" | "recover";

export function AuthForm({ mode }: { mode: Mode }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage("");
    const data = new FormData(event.currentTarget); const email = String(data.get("email")); const password = String(data.get("password") ?? "");
    try {
      const supabase = createClient();
      if (mode === "sign-in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error; window.location.assign("/account");
      } else if (mode === "sign-up") {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
        if (error) throw error; setMessage("Check your inbox to verify your AniVerse account.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=/account/security` });
        if (error) throw error; setMessage("If an account exists, a recovery link is on its way.");
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Something went wrong."); }
    finally { setLoading(false); }
  }

  async function google() {
    setLoading(true);
    try { const { error } = await createClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback` } }); if (error) throw error; }
    catch (error) { setMessage(error instanceof Error ? error.message : "Google sign-in failed."); setLoading(false); }
  }

  const title = mode === "sign-in" ? "Welcome back" : mode === "sign-up" ? "Join the universe" : "Reset your password";
  const intro = mode === "sign-in" ? "Continue your story where you left off." : mode === "sign-up" ? "Discover stories and support independent creators." : "We’ll send a secure recovery link to your inbox.";
  return <div className="auth-card"><div className="auth-logo"><span className="brand-orbit"><span /></span></div><p className="auth-kicker">ANIVERSE ACCOUNT</p><h1>{title}</h1><p className="auth-intro">{intro}</p>
    {mode !== "recover" && <button className="oauth-button" onClick={google} disabled={loading}><Globe2 size={17}/> Continue with Google</button>}
    {mode !== "recover" && <div className="auth-divider"><span/>or continue with email<span/></div>}
    <form onSubmit={submit} className="auth-form">
      {mode === "sign-up" && <label><span>Display name</span><div><UserRound size={16}/><input name="displayName" placeholder="How should we call you?" /></div></label>}
      <label><span>Email address</span><div><Mail size={16}/><input required type="email" name="email" autoComplete="email" placeholder="you@example.com" /></div></label>
      {mode !== "recover" && <label><span>Password</span><div><LockKeyhole size={16}/><input required minLength={8} type="password" name="password" autoComplete={mode === "sign-in" ? "current-password" : "new-password"} placeholder="At least 8 characters" /></div></label>}
      {mode === "sign-in" && <Link className="forgot-link" href="/recover">Forgot password?</Link>}
      <button className="auth-submit" disabled={loading}>{loading ? <LoaderCircle className="spin" size={18}/> : <>{mode === "sign-in" ? "Sign in" : mode === "sign-up" ? "Create account" : "Send recovery link"}<ArrowRight size={17}/></>}</button>
    </form>
    {message && <p className="auth-message" role="status">{message}</p>}
    <p className="auth-switch">{mode === "sign-in" ? <>New to AniVerse? <Link href="/sign-up">Create an account</Link></> : mode === "sign-up" ? <>Already have an account? <Link href="/sign-in">Sign in</Link></> : <Link href="/sign-in">Return to sign in</Link>}</p>
  </div>;
}
