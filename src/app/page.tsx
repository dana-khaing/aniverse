import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock3,
  Compass,
  Flame,
  Play,
  Search,
  Sparkles,
  Star,
} from "lucide-react";
import { Brand, HeaderActions, MobileDock } from "@/components/catalog/site-navigation";

const shows = [
  { title: "Echoes of Asteria", genre: "Fantasy", score: "9.2", episode: "12", tone: "violet", mark: "EA" },
  { title: "Neon Ronin", genre: "Sci-fi", score: "8.9", episode: "08", tone: "cyan", mark: "NR" },
  { title: "Paper Moons", genre: "Drama", score: "8.7", episode: "06", tone: "rose", mark: "PM" },
  { title: "Skybound", genre: "Adventure", score: "9.0", episode: "18", tone: "blue", mark: "SK" },
  { title: "The Last Alchemist", genre: "Mystery", score: "8.8", episode: "10", tone: "amber", mark: "LA" },
  { title: "Garden of Spirits", genre: "Supernatural", score: "8.6", episode: "04", tone: "emerald", mark: "GS" },
];

const schedule = [
  { day: "MON", date: "08", title: "Echoes of Asteria", time: "18:30" },
  { day: "TUE", date: "09", title: "Neon Ronin", time: "20:00" },
  { day: "WED", date: "10", title: "Garden of Spirits", time: "17:00" },
  { day: "THU", date: "11", title: "Paper Moons", time: "19:30" },
];

function ShowCard({ show, rank }: { show: (typeof shows)[number]; rank?: number }) {
  return (
    <article className="show-card">
      <div className={`poster poster-${show.tone}`}>
        <span className="poster-mark">{show.mark}</span>
        {rank ? <span className="rank">#{rank.toString().padStart(2, "0")}</span> : null}
        <button className="card-play" aria-label={`Play ${show.title}`}><Play fill="currentColor" size={18} /></button>
        <div className="episode-tags"><span>CC {show.episode}</span><span>EP {show.episode}</span></div>
      </div>
      <h3>{show.title}</h3>
      <div className="card-meta"><span>{show.genre}</span><span><Star fill="currentColor" size={13} /> {show.score}</span></div>
    </article>
  );
}

export default function Home() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <Brand />
        <nav className="desktop-nav" aria-label="Primary navigation">
          <Link className="active" href="/">Home</Link><Link href="/browse">Browse</Link>
          <Link href="/schedule">Schedule</Link><Link href="/community">Community</Link>
        </nav>
        <HeaderActions />
      </header>

      <main>
        <section className="hero">
          <div className="hero-art" aria-hidden="true"><div className="planet" /><div className="hero-character">天</div></div>
          <div className="hero-shade" />
          <div className="hero-content">
            <div className="eyebrow"><Sparkles size={14} /> #1 TRENDING THIS WEEK</div>
            <h1>Echoes of<br /><em>Asteria</em></h1>
            <div className="hero-meta"><span><Star fill="currentColor" size={15} /> 9.2</span><span>2026</span><span>TV</span><span>24m</span><b>HD</b><b>CC</b></div>
            <p>When the stars begin to disappear, a young cartographer discovers that her forgotten memories may be the key to saving two worlds.</p>
            <div className="hero-actions">
              <Link className="primary-button" href="/watch/echoes-of-asteria/1"><Play fill="currentColor" size={18} /> Watch now</Link>
              <Link className="secondary-button" href="/anime/echoes-of-asteria">View details <ChevronRight size={17} /></Link>
            </div>
          </div>
          <div className="hero-dots"><span className="active" /><span /><span /><span /></div>
        </section>

        <div className="content-wrap">
          <section className="quick-search" aria-label="Find anime">
            <div><Search size={21} /><input aria-label="Search anime" placeholder="Search anime, genres, creators..." /></div>
            <button>Search</button>
            <div className="trending-search"><Flame size={15} /> Trending: <Link href="/search?q=asteria">Asteria</Link><Link href="/search?q=neon">Neon Ronin</Link><Link href="/search?q=skybound">Skybound</Link></div>
          </section>

          <section className="content-section">
            <div className="section-heading"><div><span className="section-icon"><Flame size={18} /></span><div><p>WHAT EVERYONE IS WATCHING</p><h2>Trending now</h2></div></div><Link href="/trending">View all <ArrowRight size={16} /></Link></div>
            <div className="card-grid">{shows.slice(0, 5).map((show, index) => <ShowCard key={show.title} rank={index + 1} show={show} />)}</div>
          </section>

          <section className="content-section split-section">
            <div className="latest-panel">
              <div className="section-heading"><div><span className="section-icon purple"><Clock3 size={18} /></span><div><p>FRESH FROM THE STUDIOS</p><h2>Latest episodes</h2></div></div><Link href="/latest">View all <ArrowRight size={16} /></Link></div>
              <div className="latest-grid">{shows.slice(0, 4).map((show) => <ShowCard key={show.title} show={show} />)}</div>
            </div>
            <aside className="schedule-panel">
              <div className="schedule-head"><div><CalendarDays size={19} /><div><p>THIS WEEK</p><h2>Release schedule</h2></div></div><Link href="/schedule">Full calendar</Link></div>
              <div className="schedule-list">{schedule.map((item) => <Link href="/schedule" key={item.day} className="schedule-item"><div className="date-box"><span>{item.day}</span><strong>{item.date}</strong></div><div><h3>{item.title}</h3><p>New episode · {item.time}</p></div><ChevronRight size={16} /></Link>)}</div>
            </aside>
          </section>

          <section className="browse-banner">
            <div className="banner-orb"><Compass size={42} /></div>
            <div><p>YOUR NEXT OBSESSION IS WAITING</p><h2>Explore every universe</h2><span>Browse curated collections across fantasy, romance, action, sci-fi and more.</span></div>
            <Link className="secondary-button" href="/browse">Browse all anime <ArrowRight size={17} /></Link>
          </section>
        </div>
      </main>

      <footer><Brand /><p>Stories worth discovering. Creators worth supporting.</p><div><Link href="/about">About</Link><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><Link href="/takedown">Takedown</Link></div><span>© 2026 AniVerse</span></footer>
      <MobileDock />
    </div>
  );
}
