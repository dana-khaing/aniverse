"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
  Maximize,
  PictureInPicture,
} from "lucide-react";
import { initialLibraryState, useLocalDemoState } from "@/lib/local-demo";
import { getAllRecords } from "@/lib/local-data/database";
import type { StoredMedia } from "@/lib/local-data/types";

type LocalPlayerProps = {
  slug: string;
  title: string;
  episode: number;
  totalEpisodes: number;
  managedEpisodeId?: string;
};

export function LocalPlayer({
  slug,
  title,
  episode,
  totalEpisodes,
  managedEpisodeId,
}: LocalPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [source,setSource]=useState<string>();
  const [speed,setSpeed]=useState(1);
  const [quality,setQuality]=useState("Auto");
  const [audio,setAudio]=useState("Japanese");
  const [captions,setCaptions]=useState(true);
  const [autoplay,setAutoplay]=useState(true);
  const [subtitleSize,setSubtitleSize]=useState("Medium");
  const [library, setLibrary] = useLocalDemoState(
    "aniverse.library",
    initialLibraryState,
  );
  const saved = library.progress.find(
    (item) => item.slug === slug && item.episode === episode,
  );
  const [position, setPosition] = useState(saved?.position ?? 0);
  const favorite = library.favorites.includes(slug);

  useEffect(()=>{let objectUrl:string|undefined;let cancelled=false;async function resolveSource(){if(managedEpisodeId){const response=await fetch(`/api/v1/playback/${managedEpisodeId}`,{cache:"no-store"});if(response.ok){const data=await response.json() as {url:string};if(!cancelled)setSource(data.url);return;}}const assets=await getAllRecords<StoredMedia>("media");const asset=assets.find((item)=>item.kind==="video"&&(item.titleId===slug||assets.length===1));if(asset&&!cancelled){objectUrl=URL.createObjectURL(asset.blob);setSource(objectUrl);}}void resolveSource().catch(()=>undefined);return()=>{cancelled=true;if(objectUrl)URL.revokeObjectURL(objectUrl);};},[managedEpisodeId,slug]);
  useEffect(()=>{const video=videoRef.current;if(!video||!source?.includes(".m3u8"))return;let destroy:(()=>void)|undefined;if(video.canPlayType("application/vnd.apple.mpegurl")){video.src=source;}else{void import("hls.js").then(({default:Hls})=>{if(!Hls.isSupported())return;const hls=new Hls({enableWorker:true});hls.loadSource(source);hls.attachMedia(video);destroy=()=>hls.destroy();});}return()=>destroy?.();},[source]);
  useEffect(()=>{const handler=(event:KeyboardEvent)=>{if(event.target instanceof HTMLInputElement)return;const video=videoRef.current;if(!video)return;if(event.key===" "){event.preventDefault();void(video.paused?video.play():video.pause());}if(event.key==="ArrowRight")video.currentTime=Math.min(video.duration||Infinity,video.currentTime+10);if(event.key==="ArrowLeft")video.currentTime=Math.max(0,video.currentTime-10);if(event.key.toLowerCase()==="f")void video.requestFullscreen();};window.addEventListener("keydown",handler);return()=>window.removeEventListener("keydown",handler);},[]);

  function togglePlayback(){const video=videoRef.current;if(video)void(video.paused?video.play():video.pause());else setPlaying((value)=>!value);}
  function seekTo(next:number){if(videoRef.current)videoRef.current.currentTime=next;saveProgress(next);}

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
        {source&&<video ref={videoRef} src={source.includes(".m3u8")?undefined:source} playsInline onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onTimeUpdate={(event)=>setPosition(Math.floor(event.currentTarget.currentTime))} onEnded={()=>{if(autoplay&&episode<totalEpisodes)window.location.assign(`/watch/${slug}/${episode+1}`);}} onLoadedMetadata={(event)=>{event.currentTarget.currentTime=Math.min(saved?.position??0,event.currentTarget.duration);}}/>}
        <div className="video-art">
          <span>{title.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>
          <p>{playing ? "Playing local preview" : "Local secure preview"}</p>
        </div>
        <button
          className="center-play"
          aria-label={playing ? "Pause" : "Play"}
          onClick={togglePlayback}
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
                onClick={togglePlayback}
              >
                {playing ? <Pause /> : <Play />}
              </button>
              <button aria-label="Next episode"><SkipForward /></button>
              <Volume2 />
            </span>
            <time>{Math.floor(position / 60)}:{String(position % 60).padStart(2, "0")} / 24:00</time>
            <span><button aria-label="Picture in picture" onClick={()=>{const video=videoRef.current;if(video&&document.pictureInPictureEnabled)void video.requestPictureInPicture();}}><PictureInPicture/></button><button aria-label="Playback speed" onClick={()=>{const next=speed>=2?0.5:speed+0.5;setSpeed(next);if(videoRef.current)videoRef.current.playbackRate=next;}}>{speed}×</button><button aria-label="Fullscreen" onClick={()=>{if(videoRef.current)void videoRef.current.requestFullscreen();}}><Maximize/></button><button aria-label="Toggle captions" className={captions?"active":""} onClick={()=>setCaptions(!captions)}><Captions /></button><Settings /></span>
          </div>
        </div>
      </section>
      <section className="player-options" aria-label="Playback options"><div className="chapter-strip"><button onClick={()=>seekTo(0)}>Opening <span>00:00</span></button><button onClick={()=>seekTo(90)}>Chapter 1 <span>01:30</span></button><button onClick={()=>seekTo(690)}>Chapter 2 <span>11:30</span></button><button onClick={()=>seekTo(1350)}>Ending <span>22:30</span></button></div><div className="track-options"><label>Quality<select aria-label="Video quality" value={quality} onChange={(event)=>setQuality(event.target.value)}><option>Auto</option><option>1080p</option><option>720p</option><option>480p</option></select></label><label>Audio<select aria-label="Audio track" value={audio} onChange={(event)=>setAudio(event.target.value)}><option>Japanese</option><option>English</option></select></label><label>Subtitle size<select aria-label="Subtitle size" value={subtitleSize} onChange={(event)=>setSubtitleSize(event.target.value)}><option>Small</option><option>Medium</option><option>Large</option></select></label><label className="autoplay-option"><input type="checkbox" checked={autoplay} onChange={(event)=>setAutoplay(event.target.checked)}/>Autoplay next</label></div>{position>0&&position<90&&<button className="skip-segment" onClick={()=>seekTo(90)}>Skip intro</button>}{position>=1350&&<button className="skip-segment" onClick={()=>seekTo(1440)}>Skip outro</button>}</section>
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
