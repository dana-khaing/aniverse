import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { PublicHeader } from "@/components/catalog/public-header";
import { isLocale, localePath } from "@/lib/i18n";
import { getKitsuTitle } from "@/lib/kitsu/client";

type PageProps = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id, locale } = await params;
  if (!isLocale(locale)) return {};
  try {
    const title = await getKitsuTitle(id);
    return title
      ? { title: title.title, description: title.synopsis.slice(0, 160) }
      : {};
  } catch {
    return {};
  }
}

export default async function KitsuDiscoveryPage({ params }: PageProps) {
  const { id, locale } = await params;
  if (!isLocale(locale)) notFound();
  let title;
  try {
    title = await getKitsuTitle(id);
  } catch {
    notFound();
  }
  if (!title) notFound();

  const year = title.startDate?.slice(0, 4);
  return (
    <>
      <PublicHeader locale={locale} path={`/discover/kitsu/${id}`} />
      <main className="kitsu-detail" lang={locale}>
        {title.coverImage && (
          <div
            className="kitsu-backdrop"
            style={{ backgroundImage: `url(${title.coverImage})` }}
            aria-hidden="true"
          />
        )}
        <section>
          <div className="kitsu-poster">
            {title.posterImage ? (
              <Image
                src={title.posterImage}
                alt={`${title.title} poster`}
                width={420}
                height={594}
                priority
              />
            ) : (
              <span>{title.title.slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <article>
            <p className="discovery-label">KITSU DISCOVERY</p>
            <h1>{title.title}</h1>
            {title.nativeTitle !== title.title && <p className="native-title">{title.nativeTitle}</p>}
            <div className="kitsu-facts">
              {year && <span>{year}</span>}
              {title.subtype && <span>{title.subtype}</span>}
              {title.episodeCount !== null && <span>{title.episodeCount} episodes</span>}
              {title.ageRating && <span>{title.ageRating}</span>}
            </div>
            <p className="kitsu-synopsis">{title.synopsis || "No synopsis is available yet."}</p>
            <aside>
              <strong>Not currently available on AniVerse</strong>
              <span>This page is metadata for discovery, not a playable AniVerse release.</span>
            </aside>
            <div className="kitsu-actions">
              <Link href={localePath(locale, "/browse")}>Browse playable titles</Link>
              <a href={title.siteUrl} target="_blank" rel="noreferrer">
                View on Kitsu <ExternalLink size={14} />
              </a>
            </div>
            <small>Metadata and artwork supplied by Kitsu.</small>
          </article>
        </section>
      </main>
    </>
  );
}
