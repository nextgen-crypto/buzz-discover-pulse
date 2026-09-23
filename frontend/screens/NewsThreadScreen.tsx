import { useEffect, useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BadgeCheck,
  Bookmark,
  Check,
  Flag,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Repeat2,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { discussionCount } from "@/backend/api/sections.functions";
import { imageUrl } from "@/backend/domain/media";
import { articleQueryOptions, relatedNewsQueryOptions } from "@/frontend/queries/sections";
import { AppShell } from "@/frontend/components/AppShell";
import { ShareSheet } from "@/frontend/components/overlays/ShareSheet";
import { ReportDialog } from "@/frontend/components/moderation/ReportDialog";
import { useAuthGate } from "@/frontend/hooks/useAuthGate";
import { useNewsPrefs, type NewsComment } from "@/frontend/hooks/useNewsPrefs";
import { useSession } from "@/frontend/hooks/useSession";
import { cn } from "@/lib/utils";

const compact = new Intl.NumberFormat("en", { notation: "compact" });

function timeAgo(iso: string): string {
  const mins = Math.max(
    1,
    Math.round((Date.parse("2026-08-27T12:00:00.000Z") - Date.parse(iso)) / 60_000),
  );
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

const TYPE_LABEL: Record<string, string> = {
  breaking: "Breaking news",
  reporting: "Original reporting",
  analysis: "Analysis",
  opinion: "Opinion",
};

export function NewsThreadScreen() {
  const { articleId } = useParams({ from: "/news/$articleId" });
  const { data: article } = useSuspenseQuery(articleQueryOptions(articleId));
  const { data: related = [] } = useSuspenseQuery(relatedNewsQueryOptions(articleId));
  const prefs = useNewsPrefs();
  const requireAuth = useAuthGate();
  const { displayName, user } = useSession();

  const [expanded, setExpanded] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [commentLiked, setCommentLiked] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<"Top" | "Latest" | "Following">("Top");
  const [showCorrections, setShowCorrections] = useState(false);

  useEffect(() => {
    setExpanded(false);
    setMenuOpen(false);
    setDraft("");
    setReplyTo(null);
    setSort("Top");
    if (article) prefs.markRead(article.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId]);

  if (!article) {
    return (
      <AppShell title="Story not found">
        <div className="px-6 py-16 text-center">
          <p className="text-base font-bold">Unable to load story</p>
          <p className="mt-1 text-sm text-muted-foreground">Something went wrong. Try again.</p>
          <Link
            to="/news"
            className="mt-4 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-brand-foreground"
          >
            Back to news
          </Link>
        </div>
      </AppShell>
    );
  }

  const liked = prefs.liked.includes(article.id);
  const saved = prefs.saved.includes(article.id);
  const reposted = prefs.reposted.includes(article.id);
  const followingSource = prefs.sources.includes(article.sourceName.toLowerCase());
  const firstTag = article.tags[0] ?? article.category.toLowerCase();
  const followingTopic = prefs.topics.includes(firstTag.toLowerCase());
  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/news/${article.id}` : "";

  const comments = prefs.commentsFor(article.id);
  const sorted =
    sort === "Latest"
      ? [...comments].sort((a, b) => (a.time === "now" ? -1 : b.time === "now" ? 1 : 0))
      : sort === "Following"
        ? comments.filter(
            (c) =>
              prefs.sources.includes(c.user.toLowerCase()) ||
              prefs.topics.some((t) => c.text.toLowerCase().includes(t)),
          )
        : [...comments].sort((a, b) => b.likes - a.likes);
  const topLevel = sorted.filter((c) => !c.parentId);
  const repliesOf = (id: string) => sorted.filter((c) => c.parentId === id);

  function toggleCommentLike(id: string) {
    setCommentLiked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function post() {
    const text = draft.trim();
    if (!text) return;
    if (!requireAuth()) return;
    prefs.postComment(
      article!.id,
      displayName ?? user?.email?.split("@")[0] ?? "you",
      text,
      replyTo,
    );
    setDraft("");
    setReplyTo(null);
  }

  function likeArticle() {
    if (!requireAuth()) return;
    prefs.toggleLiked(article!.id);
  }

  return (
    <AppShell title={article.title}>
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6 lg:px-6">
        <div className="min-w-0">
          <div className="flex items-center gap-1 px-4 pt-3 sm:px-6 lg:px-0">
            <Link
              to="/news"
              aria-label="Back to news"
              className="grid size-9 place-items-center rounded-full hover:bg-secondary"
            >
              <ArrowLeft className="size-5" />
            </Link>
            <span className="text-sm font-bold">News</span>
            <span className="flex-1" />
            <span className="relative">
              <button
                aria-label="Story options"
                onClick={() => setMenuOpen((v) => !v)}
                className="grid size-9 place-items-center rounded-full hover:bg-secondary"
              >
                <MoreHorizontal className="size-5 text-muted-foreground" />
              </button>
              {menuOpen && (
                <>
                  <button
                    aria-label="Close menu"
                    onClick={() => setMenuOpen(false)}
                    className="fixed inset-0 z-10 cursor-default"
                  />
                  <div className="absolute right-0 top-10 z-20 w-56 overflow-hidden rounded-2xl border border-border bg-card shadow-raise">
                    {[
                      {
                        label: "Report story",
                        fn: () => setReporting(true),
                      },
                      {
                        label: "Request correction",
                        fn: () => {
                          setShowCorrections(true);
                          toast("Correction desk notified.");
                        },
                      },
                      { label: "View corrections", fn: () => setShowCorrections((v) => !v) },
                    ].map(({ label, fn }) => (
                      <button
                        key={label}
                        onClick={() => {
                          setMenuOpen(false);
                          fn();
                        }}
                        className="block w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-secondary"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </span>
          </div>

          <div className="px-4 pt-3 sm:px-6 lg:px-0">
            <div className="flex items-center gap-2.5">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-sm font-black">
                {article.sourceName.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  {article.live ? "Live thread" : (TYPE_LABEL[article.contentType] ?? "Story")}
                </p>
                <p className="flex items-center gap-1 truncate text-sm font-bold">
                  {article.sourceName}
                  <BadgeCheck className="size-4 shrink-0 text-brand" />
                </p>
                <p className="truncate text-xs text-muted-foreground">@{article.sourceHandle}</p>
              </div>
              <button
                onClick={() => prefs.toggleSource(article.sourceName)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-1.5 text-xs font-bold",
                  followingSource ? "bg-brand-soft text-brand" : "bg-secondary text-foreground",
                )}
              >
                {followingSource ? "Following" : "Follow"}
              </button>
            </div>

            <h1 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight">
              {article.title}
            </h1>
            {article.live && (
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-live/10 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-live">
                <span className="size-1.5 animate-pulse rounded-full bg-live" /> Breaking
                {article.updates.length > 0 ? ` · ${article.updates.length} updates` : ""}
              </span>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Published {timeAgo(article.publishedAt)}
              {article.updatedAt !== article.publishedAt
                ? ` · Updated ${timeAgo(article.updatedAt)}`
                : ""}{" "}
              · {article.location}
            </p>
          </div>

          <figure className="mt-3 px-4 sm:px-6 lg:px-0">
            <img
              src={imageUrl(article.imageKey, "large", 16 / 10)}
              alt={article.title}
              className="aspect-[16/10] w-full rounded-2xl border border-border object-cover"
            />
            <figcaption className="mt-1.5 text-[11px] text-muted-foreground">
              {article.imageCredit}
            </figcaption>
          </figure>

          <div className="px-4 pt-4 sm:px-6 lg:px-0">
            <p className="text-[15px] font-semibold leading-relaxed">{article.subheadline}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              By {article.reporter} · {article.readMinutes} min read
            </p>
            <div className="mt-3 space-y-3">
              {article.body.slice(0, expanded ? undefined : 2).map((para, i) => (
                <p key={i} className="text-[15px] leading-relaxed text-foreground">
                  {para}
                </p>
              ))}
              {!expanded && article.pullQuote && (
                <blockquote className="border-l-2 border-brand pl-4 text-lg font-bold leading-snug">
                  “{article.pullQuote}”
                </blockquote>
              )}
              {expanded && (
                <>
                  {article.pullQuote && (
                    <blockquote className="border-l-2 border-brand pl-4 text-lg font-bold leading-snug">
                      “{article.pullQuote}”
                    </blockquote>
                  )}
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Source references · {article.url.replace("https://", "").split("/")[0]}
                  </p>
                </>
              )}
            </div>
            {article.body.length > 2 && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="mt-2 text-sm font-bold text-brand"
              >
                {expanded ? "Show less" : "Open the complete story"}
              </button>
            )}
          </div>

          {article.updates.length > 0 && (
            <section className="mt-6 px-4 sm:px-6 lg:px-0" aria-label="Live updates">
              <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
                <span className="size-2 animate-pulse rounded-full bg-live" /> Live updates
              </h2>
              <ol className="mt-3 space-y-0">
                {article.updates.map((u, i) => (
                  <li key={i} className="relative flex gap-3 pb-5 last:pb-0">
                    {i < article.updates.length - 1 && (
                      <span
                        aria-hidden="true"
                        className="absolute left-[5px] top-4 h-full w-px bg-border"
                      />
                    )}
                    <span className="mt-1.5 size-[11px] shrink-0 rounded-full border-2 border-live bg-background" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold tabular-nums text-muted-foreground">
                        {u.time}
                      </p>
                      <p className="mt-0.5 text-sm leading-relaxed">{u.text}</p>
                      <p className="mt-0.5 text-xs font-semibold text-brand">{u.source}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section className="mt-6 px-4 sm:px-6 lg:px-0" aria-label="Discussion">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-black uppercase tracking-widest">Discussion</h2>
              <div className="flex gap-1">
                {(["Top", "Latest", "Following"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSort(s)}
                    className={cn(
                      "rounded-full px-3 py-1 text-[11px] font-bold",
                      sort === s
                        ? "bg-foreground text-background"
                        : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") post();
                }}
                placeholder={replyTo ? "Write a reply…" : "Join the discussion…"}
                aria-label="Join the discussion"
                className="min-w-0 flex-1 rounded-full bg-secondary px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                onClick={post}
                disabled={!draft.trim()}
                className="shrink-0 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-brand-foreground disabled:opacity-50"
              >
                Post
              </button>
            </div>
            {replyTo && (
              <button
                onClick={() => setReplyTo(null)}
                className="mt-1.5 text-xs font-semibold text-muted-foreground"
              >
                Replying — tap to cancel
              </button>
            )}
            <ul className="mt-3 space-y-4">
              {topLevel.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  {sort === "Following"
                    ? "Nobody you follow has commented yet."
                    : "Be the first to comment."}
                </p>
              )}
              {topLevel.map((c) => (
                <li key={c.id}>
                  <CommentRow
                    comment={c}
                    liked={commentLiked.has(c.id)}
                    onReply={() => setReplyTo(c.id)}
                    onLike={() => toggleCommentLike(c.id)}
                  />
                  {repliesOf(c.id).map((r) => (
                    <div key={r.id} className="ml-10 mt-3 border-l-2 border-border pl-3">
                      <CommentRow
                        comment={r}
                        nested
                        liked={commentLiked.has(r.id)}
                        onReply={() => setReplyTo(c.id)}
                        onLike={() => toggleCommentLike(r.id)}
                      />
                    </div>
                  ))}
                </li>
              ))}
            </ul>
          </section>

          {article.coverage.length > 0 && (
            <section
              className="mt-6 px-4 sm:px-6 lg:px-0"
              aria-label="Coverage from multiple sources"
            >
              <h2 className="text-sm font-black uppercase tracking-widest">Coverage</h2>
              <ul className="mt-2 divide-y divide-border rounded-2xl border border-border">
                {article.coverage.map((s) => (
                  <li key={s.name} className="px-3 py-2.5">
                    <p className="flex items-center gap-1 text-xs font-bold">
                      {s.name}
                      <BadgeCheck className="size-3.5 text-brand" />
                      <span className="font-medium text-muted-foreground">· {s.time}</span>
                    </p>
                    <p className="mt-0.5 text-sm font-semibold leading-snug">{s.headline}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {s.summary}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-6 px-4 sm:px-6 lg:px-0" aria-label="About this story">
            <div className="rounded-2xl bg-secondary p-4">
              <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                About this story
              </p>
              <dl className="mt-2 space-y-1 text-[13px]">
                {[
                  ["Source", article.sourceName],
                  ["Author", article.reporter],
                  ["Location", article.location],
                  ["Type", TYPE_LABEL[article.contentType] ?? "Story"],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <dt className="w-16 shrink-0 text-muted-foreground">{k}</dt>
                    <dd className="font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>
              <a
                href={article.url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block rounded-full bg-background px-4 py-2 text-xs font-bold"
              >
                View source
              </a>
            </div>
          </section>

          {showCorrections && (
            <section className="mt-4 px-4 sm:px-6 lg:px-0" aria-label="Corrections">
              <div className="rounded-2xl border border-border p-4">
                <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                  Corrections
                </p>
                <p className="mt-1.5 text-[13px] leading-relaxed">
                  No corrections issued for this story. If you spot an error, use ··· → Request
                  correction and the desk is notified.
                </p>
              </div>
            </section>
          )}

          <div className="sticky bottom-20 z-20 mx-4 mt-4 sm:mx-6 lg:mx-0">
            <div className="flex items-center gap-1 rounded-full border border-border bg-background/95 px-2 py-1.5 shadow-raise backdrop-blur">
              <button
                onClick={likeArticle}
                aria-label="Like story"
                aria-pressed={liked}
                className="press flex items-center gap-1.5 rounded-full px-3 py-1.5 hover:bg-secondary"
              >
                <Heart
                  className={cn("size-4", liked ? "fill-live text-live" : "text-foreground")}
                />
              </button>
              <button
                aria-label="Comments"
                onClick={() =>
                  document
                    .querySelector('[aria-label="Discussion"]')
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="rounded-full p-2 hover:bg-secondary"
              >
                <MessageCircle className="size-4 text-foreground" />
              </button>
              <button
                onClick={() => {
                  if (!requireAuth()) return;
                  prefs.toggleReposted(article.id);
                  toast(reposted ? "Repost removed" : "Reposted to your feed");
                }}
                aria-label="Repost"
                className="press rounded-full p-2 hover:bg-secondary"
              >
                <Repeat2 className={cn("size-4", reposted ? "text-brand" : "text-foreground")} />
              </button>
              <button
                onClick={() => setSharing(true)}
                aria-label="Share"
                className="rounded-full p-2 hover:bg-secondary"
              >
                <Share2 className="size-4 text-foreground" />
              </button>
              <span className="flex-1" />
              <button
                onClick={() => {
                  const t = article.tags[0] ?? article.category;
                  prefs.toggleTopic(t);
                  toast(
                    prefs.topics.includes(t.toLowerCase())
                      ? `Unfollowed #${t}`
                      : `Following #${t} — your For You reshapes`,
                  );
                }}
                className="rounded-full bg-secondary px-3 py-1.5 text-xs font-bold"
              >
                {followingTopic ? "Following" : "Follow topic"}
              </button>
              <button
                onClick={() => prefs.toggleSaved(article.id)}
                aria-label="Save story"
                aria-pressed={saved}
                className="press rounded-full p-2 hover:bg-secondary"
              >
                <Bookmark
                  className={cn("size-4", saved ? "fill-brand text-brand" : "text-foreground")}
                />
              </button>
            </div>
          </div>
        </div>

        <aside className="min-w-0 px-4 pt-2 sm:px-6 lg:px-0 lg:pt-3">
          <h2 className="pb-2 text-sm font-black uppercase tracking-widest">Related stories</h2>
          {related.length === 0 ? (
            <p className="rounded-2xl bg-secondary p-4 text-center text-xs text-muted-foreground">
              No related stories yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {related.map((r) => (
                <li key={r.id}>
                  <Link
                    to="/news/$articleId"
                    params={{ articleId: r.id }}
                    className="group flex gap-2.5"
                  >
                    <span className="w-28 shrink-0 overflow-hidden rounded-xl bg-surface-strong">
                      <img
                        src={imageUrl(r.imageKey, "thumbnail", 16 / 10)}
                        alt=""
                        loading="lazy"
                        className="aspect-[16/10] w-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 text-[13px] font-semibold leading-snug">
                        {r.title}
                      </span>
                      <span className="mt-1 block text-[11px] text-muted-foreground">
                        {r.sourceName} · {r.category}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
      <div className="h-6" aria-hidden="true" />

      <ShareSheet
        open={sharing}
        onClose={() => setSharing(false)}
        url={shareUrl}
        message={`${article.title} — ${article.sourceName} on WIZZ`}
      />
      <ReportDialog
        open={reporting}
        onClose={() => setReporting(false)}
        target={{ kind: "article", refId: article.id, refTitle: article.title }}
      />
    </AppShell>
  );
}

function CommentRow({
  comment,
  nested,
  liked,
  onReply,
  onLike,
}: {
  comment: NewsComment;
  nested?: boolean;
  liked: boolean;
  onReply: () => void;
  onLike: () => void;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold">
        {comment.user.slice(0, 1).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1 text-xs font-bold">
          {comment.user}
          {comment.verified && <BadgeCheck className="size-3.5 text-brand" />}
          <span className="font-medium text-muted-foreground">· {comment.time}</span>
        </p>
        <p className="mt-0.5 break-words text-sm leading-relaxed">{comment.text}</p>
        {!nested && (
          <button onClick={onReply} className="mt-1 text-xs font-bold text-muted-foreground">
            Reply
          </button>
        )}
      </div>
      <button aria-label="Like reply" onClick={onLike} className="flex shrink-0 items-center gap-1">
        <Heart
          className={cn("size-3.5", liked ? "fill-live text-live" : "text-muted-foreground")}
        />
        <span className="text-[11px] font-semibold text-muted-foreground">
          {comment.likes + (liked ? 1 : 0)}
        </span>
      </button>
    </div>
  );
}
