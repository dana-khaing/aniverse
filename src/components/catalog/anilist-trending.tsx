import { ExternalLink, Star } from "lucide-react";
import { getAniListTrending } from "@/lib/anilist/client";

export async function AniListTrending({ limit = 8 }: { limit?: number }) {
  const titles = await getAniListTrending(limit).catch(() => []);
  if (titles.length === 0) return null;
  return (
    <section className="anilist-trending">
      <div className="anilist-trending-head">
        <div>
          <p>EXTERNAL · ANILIST</p>
          <h2>Trending on AniList</h2>
          <span>Community discovery data from AniList, not part of the AniVerse catalog.</span>
        </div>
        <a href="https://anilist.co/search/anime/trending" target="_blank" rel="noreferrer">
          View on AniList <ExternalLink size={12} />
        </a>
      </div>
      <ul className="anilist-trending-grid">
        {titles.map((title) => (
          <li key={title.id}>
            <a href={title.siteUrl} target="_blank" rel="noreferrer">
              <div className="anilist-poster" style={title.coverImage ? { backgroundImage: `url(${title.coverImage})` } : undefined}>
                {!title.coverImage && <span>{title.title.slice(0, 2)}</span>}
              </div>
              <h3>{title.title}</h3>
              <p>
                {title.format ?? "TV"} · {title.year ?? "—"}
                {title.score !== null && (
                  <span>
                    <Star size={11} fill="currentColor" />
                    {(title.score / 10).toFixed(1)}
                  </span>
                )}
              </p>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
