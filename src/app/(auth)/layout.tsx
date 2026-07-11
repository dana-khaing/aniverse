import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main className="auth-page"><Link className="auth-brand" href="/"><span className="brand-orbit"><span /></span><strong>Ani<span>Verse</span></strong></Link><div className="auth-orb" aria-hidden="true"/><section>{children}</section><p className="auth-legal">By continuing, you agree to the <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.</p></main>;
}
