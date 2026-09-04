"use client";
import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  Flag,
  Heart,
  LoaderCircle,
  MessageCircle,
  Plus,
  Send,
  UserPlus,
  X,
} from "lucide-react";
import {
  initialCommunityState,
  useLocalDemoState,
  type CommunityState,
} from "@/lib/local-demo";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Locale } from "@/lib/i18n";
const communityCopy = {
  en: {
    eyebrow: "ANIVERSE COMMUNITY",
    title: "Stories are better together",
    intro:
      "Discuss episodes, follow creators, and celebrate independent animation.",
    follow: "Follow Lumen Works",
    following: "Following Lumen Works",
    composer: "Create community post",
    placeholder: "Share a thought with the community...",
    publish: "Publish post",
    activity: "ACTIVITY",
    notifications: "Notifications",
    readAll: "Mark all read",
    reply: "Write a reply...",
    report: "Report",
    reported: "Reported",
  },
  ja: {
    eyebrow: "ANIVERSE コミュニティ",
    title: "物語を、みんなで楽しもう",
    intro:
      "エピソードを語り、クリエイターをフォローし、独立系アニメーションを応援しましょう。",
    follow: "Lumen Worksをフォロー",
    following: "Lumen Worksをフォロー中",
    composer: "コミュニティ投稿を作成",
    placeholder: "コミュニティに感想を共有...",
    publish: "投稿する",
    activity: "アクティビティ",
    notifications: "通知",
    readAll: "すべて既読",
    reply: "返信を書く...",
    report: "報告",
    reported: "報告済み",
  },
} as const;
export function CommunityFeed({ locale = "en" }: { locale?: Locale }) {
  const labels = communityCopy[locale];
  const [community, setCommunity] = useLocalDemoState(
    "aniverse.community",
    initialCommunityState,
  );
  const [body, setBody] = useState("");
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const cloud = isSupabaseConfigured();
  const followed = community.followedCreators.includes("Lumen Works");
  const [reporting, setReporting] = useState<string>();
  const [reportReason, setReportReason] = useState("spam");
  const [reportDetails, setReportDetails] = useState("");
  const [reported, setReported] = useState<string[]>([]);
  const load = useCallback(async () => {
    if (!cloud) return;
    setBusy(true);
    const response = await fetch("/api/v1/community", { cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as {
      posts?: CommunityState["posts"];
      notifications?: CommunityState["notifications"];
      followedFeatured?: boolean;
      error?: string;
    };
    if (response.ok)
      setCommunity({
        posts: data.posts ?? [],
        notifications: data.notifications ?? [],
        followedCreators: data.followedFeatured ? ["Lumen Works"] : [],
      });
    else setError(data.error ?? "Community could not be loaded.");
    setBusy(false);
  }, [cloud, setCommunity]);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);
  async function action(payload: object) {
    const response = await fetch("/api/v1/community", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      setError(data.error ?? "Community action could not be saved.");
      return false;
    }
    return true;
  }
  async function publish(event: React.FormEvent) {
    event.preventDefault();
    const value = body.trim();
    if (!value) return;
    if (cloud) {
      setBusy(true);
      if (await action({ type: "post", body: value })) await load();
      setBusy(false);
    } else
      setCommunity((current) => ({
        ...current,
        posts: [
          {
            id: crypto.randomUUID(),
            author: "You",
            title: "Community post",
            body: value,
            likes: 0,
            liked: false,
            replies: [],
          },
          ...current.posts,
        ],
      }));
    setBody("");
  }
  async function toggleFollow() {
    const next = !followed;
    if (cloud && !(await action({ type: "follow-featured", followed: next })))
      return;
    setCommunity((current) => ({
      ...current,
      followedCreators: next ? ["Lumen Works"] : [],
    }));
  }
  async function like(id: string) {
    const post = community.posts.find((item) => item.id === id);
    if (!post) return;
    const liked = !post.liked;
    if (cloud && !(await action({ type: "like", postId: id, liked }))) return;
    setCommunity((current) => ({
      ...current,
      posts: current.posts.map((item) =>
        item.id === id
          ? { ...item, liked, likes: item.likes + (liked ? 1 : -1) }
          : item,
      ),
    }));
  }
  async function reply(id: string) {
    const value = replies[id]?.trim();
    if (!value) return;
    if (cloud && !(await action({ type: "reply", postId: id, body: value })))
      return;
    setCommunity((current) => ({
      ...current,
      posts: current.posts.map((item) =>
        item.id === id ? { ...item, replies: [...item.replies, value] } : item,
      ),
    }));
    setReplies((current) => ({ ...current, [id]: "" }));
  }
  async function readAll() {
    if (cloud && !(await action({ type: "read-notifications" }))) return;
    setCommunity((current) => ({
      ...current,
      notifications: current.notifications.map((item) => ({
        ...item,
        read: true,
      })),
    }));
  }
  async function submitReport(event: React.FormEvent) {
    event.preventDefault();
    if (!reporting || reportDetails.trim().length < 10) return;
    setBusy(true);
    if (
      !cloud ||
      (await action({
        type: "report",
        postId: reporting,
        reason: reportReason,
        details: reportDetails,
      }))
    ) {
      setReported((current) => [...current, reporting]);
      setReporting(undefined);
      setReportDetails("");
    }
    setBusy(false);
  }
  return (
    <main className="community-page" lang={locale}>
      <header>
        <div>
          <p>{labels.eyebrow}</p>
          <h1>{labels.title}</h1>
          <span>{labels.intro}</span>
        </div>
        <button disabled={busy} onClick={() => void toggleFollow()}>
          <UserPlus />
          {followed ? labels.following : labels.follow}
        </button>
      </header>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {reporting && (
        <div
          className="report-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="community-report-title"
        >
          <form onSubmit={(event) => void submitReport(event)}>
            <header>
              <div>
                <p>COMMUNITY SAFETY</p>
                <h2 id="community-report-title">Report community post</h2>
              </div>
              <button
                type="button"
                aria-label="Close report"
                onClick={() => setReporting(undefined)}
              >
                <X />
              </button>
            </header>
            <label>
              Reason
              <select
                value={reportReason}
                onChange={(event) => setReportReason(event.target.value)}
              >
                <option value="spam">Spam</option>
                <option value="harassment">Harassment</option>
                <option value="spoilers">Unmarked spoilers</option>
                <option value="unsafe_content">Unsafe content</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label>
              What happened?
              <textarea
                required
                minLength={10}
                maxLength={2000}
                value={reportDetails}
                onChange={(event) => setReportDetails(event.target.value)}
                placeholder="Give moderators enough context to investigate."
              />
            </label>
            <button disabled={busy}>
              <Flag />
              Submit confidential report
            </button>
          </form>
        </div>
      )}
      <div className="community-grid">
        <section>
          <form
            className="post-composer"
            onSubmit={(event) => void publish(event)}
          >
            <span>DL</span>
            <textarea
              aria-label={labels.composer}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder={labels.placeholder}
            />
            <button disabled={busy} aria-label={labels.publish}>
              {busy ? <LoaderCircle className="spin" /> : <Send />}
            </button>
          </form>
          <div className="feed-list">
            {community.posts.map((post) => (
              <article key={post.id}>
                <header>
                  <span>{post.author.slice(0, 1)}</span>
                  <div>
                    <b>{post.author}</b>
                    <small>{post.title}</small>
                  </div>
                  <button
                    disabled={reported.includes(post.id)}
                    aria-label={`${labels.report}: ${post.author}`}
                    onClick={() => setReporting(post.id)}
                  >
                    <Flag />
                    {reported.includes(post.id)
                      ? labels.reported
                      : labels.report}
                  </button>
                </header>
                <p>{post.body}</p>
                <div className="post-actions">
                  <button
                    className={post.liked ? "active" : ""}
                    onClick={() => void like(post.id)}
                  >
                    <Heart fill={post.liked ? "currentColor" : "none"} />
                    {post.likes}
                  </button>
                  <button>
                    <MessageCircle />
                    {post.replies.length}
                  </button>
                </div>
                {post.replies.map((item, index) => (
                  <blockquote key={`${post.id}-${index}`}>{item}</blockquote>
                ))}
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void reply(post.id);
                  }}
                >
                  <input
                    aria-label={`${labels.reply} ${post.author}`}
                    value={replies[post.id] ?? ""}
                    onChange={(event) =>
                      setReplies((current) => ({
                        ...current,
                        [post.id]: event.target.value,
                      }))
                    }
                    placeholder={labels.reply}
                  />
                  <button>
                    <Plus />
                  </button>
                </form>
              </article>
            ))}
          </div>
        </section>
        <aside>
          <div className="notification-head">
            <Bell />
            <div>
              <p>{labels.activity}</p>
              <h2>{labels.notifications}</h2>
            </div>
            <button onClick={() => void readAll()}>{labels.readAll}</button>
          </div>
          {community.notifications.map((item) => (
            <article className={item.read ? "" : "unread"} key={item.id}>
              <b>{item.title}</b>
              <p>{item.body}</p>
            </article>
          ))}
        </aside>
      </div>
    </main>
  );
}
