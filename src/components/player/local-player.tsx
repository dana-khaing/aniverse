"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Captions,
  Heart,
  ListPlus,
  Pause,
  Play,
  Settings,
  SkipBack,
  SkipForward,
  Volume2,
} from "lucide-react";
import { initialLibraryState, useLocalDemoState } from "@/lib/local-demo";

type LocalPlayerProps = {
  slug: string;
  title: string;
  episode: number;
  totalEpisodes: number;
};

export function LocalPlayer({
  slug,
  title,
  episode,
  totalEpisodes,
}: LocalPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [library, setLibrary] = useLocalDemoState(
    "aniverse.library",
    initialLibraryState,
  );
  const saved = library.progress.find(
    (item) => item.slug === slug && item.episode === episode,
  );
  const [position, setPosition] = useState(saved?.position ?? 0);
  const favorite = library.favorites.includes(slug);

  function saveProgress(next: number) {
    setPosition(next);
    setLibrary((current) => ({
      ...current,
      progress: [
        {
          slug,
          title,
          episode,
          position: next,
          duration: 1440,
          watchedAt: new Date().toISOString(),
        },
        ...current.progress.filter(
          (item) => !(item.slug === slug && item.episode === episode),
        ),
      ],
    }));
  }

  function toggleFavorite() {
    setLibrary((current) => ({
      ...current,
      favorites: favorite
        ? current.favorites.filter((item) => item !== slug)
        : [...current.favorites, slug],
    }));
  }

  function addToFirstList() {
    setLibrary((current) => ({
      ...current,
      lists: current.lists.map((list, index) =>
        index === 0
          ? { ...list, titles: Array.from(new Set([...list.titles, slug])) }
          : list,
      ),
    }));
  }

  return (
    <main className="watch-shell">
      <header>
        <Link className="brand" href="/">
          <span className="brand-orbit"><span /></span>
          <span>Ani<span>Verse</span></span>
        </Link>
        <Link href={`/anime/${slug}`}>Back to series</Link>
      </header>
      <section className="video-stage">
        <div className="video-art">
          <span>{title.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>
          <p>{playing ? "Playing local preview" : "Local secure preview"}</p>
        </div>
        <button
          className="center-play"
          aria-label={playing ? "Pause" : "Play"}
          onClick={() => setPlaying(!playing)}
        >
          {playing ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
        </button>
        <div className="video-controls">
          <input
            aria-label="Playback position"
            type="range"
            min="0"
            max="1440"
            value={position}
            onChange={(event) => saveProgress(Number(event.target.value))}
          />
          <div>
            <span>
              <button aria-label="Previous episode"><SkipBack /></button>
              <button
                aria-label={playing ? "Pause" : "Play"}
                onClick={() => setPlaying(!playing)}
              >
                {playing ? <Pause /> : <Play />}
              </button>
              <button aria-label="Next episode"><SkipForward /></button>
              <Volume2 />
            </span>
            <time>{Math.floor(position / 60)}:{String(position % 60).padStart(2, "0")} / 24:00</time>
            <span><Captions /><Settings /></span>
          </div>
        </div>
      </section>
      <section className="watch-info">
        <div>
          <p>EPISODE {episode} OF {totalEpisodes}</p>
          <h1>{title}</h1>
          <span>Where the sky remembers · English / Japanese · CC</span>
        </div>
        <div>
          <button className={favorite ? "active" : ""} onClick={toggleFavorite}>
            <Heart fill={favorite ? "currentColor" : "none"} />Favorite
          </button>
          <button onClick={addToFirstList}><ListPlus />Add to list</button>
        </div>
      </section>
      <nav className="episode-nav">
        {episode > 1 ? (
          <Link href={`/watch/${slug}/${episode - 1}`}><SkipBack />Episode {episode - 1}</Link>
        ) : <span />}
        {episode < totalEpisodes ? (
          <Link href={`/watch/${slug}/${episode + 1}`}>Episode {episode + 1}<SkipForward /></Link>
        ) : null}
      </nav>
    </main>
  );
}
