import Link from "next/link";
import { Brand } from "@/components/catalog/site-navigation";
import { legalVersion } from "@/lib/legal";

export function LegalShell({
  title,
  kicker,
  summary,
  children,
}: {
  title: string;
  kicker: string;
  summary: string;
  children: React.ReactNode;
}) {
  return (
    <main className="legal-page">
      <nav>
        <Brand />
        <div>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/copyright">Copyright</Link>
          <Link href="/takedown">DMCA</Link>
        </div>
      </nav>
      <header>
        <p>{kicker}</p>
        <h1>{title}</h1>
        <span>{summary}</span>
        <small>Effective {legalVersion} · Last updated {legalVersion}</small>
      </header>
      <article>{children}</article>
      <footer>
        <span>Questions about these policies?</span>
        <a href="mailto:legal@aniverse.example">legal@aniverse.example</a>
      </footer>
    </main>
  );
}
