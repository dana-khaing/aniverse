import Link from "next/link";
import { RefreshCcw, WifiOff } from "lucide-react";
import { Brand } from "@/components/catalog/site-navigation";

export default function OfflinePage() {
  return (
    <main className="offline-page">
      <Brand href="/en" />
      <section>
        <WifiOff />
        <p>CONNECTION LOST</p>
        <h1>You are offline</h1>
        <span>
          AniVerse could not reach this page. Reconnect, then try it again—your
          requested destination has not been replaced.
        </span>
        <Link href="/en">
          <RefreshCcw />
          Try again
        </Link>
      </section>
    </main>
  );
}
