import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  Bell,
  Bookmark,
  Flame,
  Heart,
  MapPin,
  MessageCircle,
  Repeat2,
  Search,
  Share2,
} from "lucide-react";
import { discussionCount } from "@/backend/api/sections.functions";
import { creators, explorePhotos } from "@/backend/database/seed";
import { imageUrl } from "@/backend/domain/media";
import type { NewsArticle } from "@/backend/domain/types";
import { newsQueryOptions, newsTopicsQueryOptions } from "@/frontend/queries/sections";
import { AppShell } from "@/frontend/components/AppShell";
import { ShareSheet } from "@/frontend/components/overlays/ShareSheet";
import { useNewsPrefs } from "@/frontend/hooks/useNewsPrefs";
import { cn } from "@/lib/utils";

const compact = new Intl.NumberFormat("en", { notation: "compact" });

const TABS = ["News", "Following", "For You", "Trending", "Local", "Saved"] as const;
const CATEGORIES = [
  "All",
  "Tanzania",
  "Africa",
  "World",
  "Politics",
  "Business",
  "Technology",
  "Sports",
  "Entertainment",
  "Health",
  "Science",
  "Education",
  "Crime",
  "Lifestyle",
  "Environment",
] as const;
const CITIES = ["Dar es Salaam", "Nairobi", "Lagos", "Lisbon", "London", "Berlin", "San Francisco"];
const SEARCH_SCOPES = ["Latest", "Relevant", "Most discussed"] as const;
const DISCOVER_FILTERS = ["All", "Travel", "Design", "Food", "Sports"] as const;

function pseudo(id: string, mod: number, base: number): number {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return base + (h % mod);
}

export function NewsScreen() {
  const { data: articles } = useSuspenseQuery(newsQueryOptions);
  const { data: topics = [] } = useQuery(newsTopicsQueryOptions);
  const prefs = useNewsPrefs();

  const [tab, setTab] = useState<(typeof TABS)[number]>("News");
  const [category, setCategory] = useState<string>("All");
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<(typeof SEARCH_SCOPES)[number]>("Relevant");
  const [city, setCity] = useState(CITIES[0]!);
  const [savedFilter, setSavedFilter] = useState<"All" | "Unread">("All");
  const [discover, setDiscover] = useState<(typeof DISCOVER_FILTERS)[number]>("All");
  const [viewing, setViewing] = useState<(typeof explorePhotos)[number] | null>(null);
  const [sharing, setSharing] = useState<NewsArticle | null>(null);

  const byId = useMemo(() => new Map(creators.map((c) => [c.id, c])), []);
  const photos = useMemo(
    () =>
      discover === "All" ? explorePhotos : explorePhotos.filter((p) => p.category === discover),
    [discover],
  );

  const feed = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = [...articles];
    if (category !== "All") list = list.filter((a) => a.category === category);
    if (q) {
      list = list
        .map((a) => {
          const hay =
            `${a.title} ${a.summary} ${a.sourceName} ${a.reporter} ${a.location} ${a.tags.join(" ")}`.toLowerCase();
          const hits = q.split(/\s+/).filter((w) => hay.includes(w)).length;
          return { a, hits };
        })
        .filter((x) => x.hits > 0)
        .sort((x, y) => {
          if (scope === "Most discussed") return discussionCount(y.a.id) - discussionCount(x.a.id);
          if (scope === "Latest") return y.a.publishedAt.localeCompare(x.a.publishedAt);
          return y.hits - x.hits || discussionCount(y.a.id) - discussionCount(x.a.id);
        })
        .map((x) => x.a);
      return list;
    }
    if (tab === "Following") {
      const followed = list.filter(
        (a) =>
          prefs.topics.some(
            (t) => a.tags.map((x) => x.toLowerCase()).includes(t) || a.category.toLowerCase() === t,
          ) || prefs.sources.includes(a.sourceName.toLowerCase()),
      );
      return followed;
    }
    if (tab === "Saved") {
      let saved = list.filter((a) => prefs.saved.includes(a.id));
      if (savedFilter === "Unread") saved = saved.filter((a) => !prefs.read.includes(a.id));
      return saved;
    }
    if (tab === "Trending") {
      return [...list].sort((a, b) => discussionCount(b.id) - discussionCount(a.id));
    }
    if (tab === "Local") {
      return list.filter((a) => a.location === city);
    }
    if (tab === "For You") {
      const hot = (a: NewsArticle) =>
        (prefs.topics.some((t) => a.tags.map((x) => x.toLowerCase()).includes(t)) ? 1000 : 0) +
        discussionCount(a.id);
      return [...list].sort((a, b) => hot(b) - hot(a));
    }
    return list;
  }, [articles, tab, category, query, scope, city, savedFilter, prefs]);

  return (
    <AppShell title="News">
      <div className="lg:grid lg:grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_300px]">
        {/* Left rail (desktop): categories + following */}
        <aside className="hidden border-r border-border p-4 lg:block">
          <p className="px-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Categories
          </p>
          <ul className="mt-2 space-y-0.5">
            {CATEGORIES.map((c) => (
              <li key={c}>
                <button
                  onClick={() => {
                    setCategory(c);
                    setTab("News");
                  }}
                  className={cn(
                    "w-full rounded-xl px-3 py-2 text-left text-sm",
                    category === c && tab === "News"
                      ? "bg-secondary font-bold text-foreground"
                      : "text-muted-foreground hover:bg-secondary",
                  )}
                >
                  {c}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-5 px-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Following
          </p>
          {prefs.topics.length === 0 && prefs.sources.length === 0 ? (
            <p className="mt-2 px-2 text-xs leading-relaxed text-muted-foreground">
              Follow topics and sources to personalize your news.
            </p>
          ) : (
            <ul className="mt-2 space-y-0.5">
              {[...prefs.topics.map((t) => `#${t}`), ...prefs.sources.map((s) => `@${s}`)].map(
                (f) => (
                  <li key={f} className="truncate rounded-xl px-3 py-1.5 text-sm text-foreground">
                    {f}
                  </li>
                ),
              )}
            </ul>
          )}
        </aside>

        {/* Center feed */}
        <div className="min-w-0">
          <div className="sticky top-14 z-20 border-b border-border bg-background/95 pt-2 backdrop-blur">
            <div className="rail flex gap-1 overflow-x-auto px-3 no-scrollbar sm:px-5">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "shrink-0 rounded-full px-4 py-2 text-sm font-semibold",
                    tab === t
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-secondary",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 px-3 py-2 sm:px-5">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-secondary px-3 py-2">
                <Search className="size-4 shrink-0 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Headlines, topics, journalists, places"
                  aria-label="Search news"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
              {query.trim() && (
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value as (typeof SEARCH_SCOPES)[number])}
                  aria-label="Search scope"
                  className="shrink-0 rounded-full bg-secondary px-2 py-2 text-xs font-semibold"
                >
                  {SEARCH_SCOPES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="rail flex gap-1.5 overflow-x-auto px-3 pb-2 no-scrollbar sm:px-5 lg:hidden">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold",
                    category === c
                      ? "bg-brand text-brand-foreground"
                      : "bg-secondary text-muted-foreground",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {tab === "Local" && (
            <div className="flex items-center gap-2 px-4 pt-3 sm:px-6">
              <MapPin className="size-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Near</span>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                aria-label="Your city"
                className="rounded-full bg-secondary px-3 py-1.5 text-xs font-bold"
              >
                {CITIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          {tab === "Saved" && (
            <div className="flex gap-1.5 px-4 pt-3 sm:px-6">
              {(["All", "Unread"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setSavedFilter(f)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-xs font-bold",
                    savedFilter === f
                      ? "bg-foreground text-background"
                      : "bg-secondary text-muted-foreground",
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          )}

          {tab === "Following" && prefs.topics.length === 0 && prefs.sources.length === 0 && (
            <EmptyBlock
              title="Follow topics to personalize your news"
              body="Tap any #tag or source to follow it. Your feed reshapes around what you follow."
            />
          )}
          {tab === "Saved" && feed.length === 0 && (
            <EmptyBlock
              title="No saved stories"
              body="Save any story to build your reading list."
            />
          )}
          {tab === "Local" && feed.length === 0 && (
            <EmptyBlock
              title={`Nothing near ${city} yet`}
              body="Try another city or check the main feed."
            />
          )}
          {query.trim() && feed.length === 0 && (
            <EmptyBlock
              title="No results"
              body={`We couldn't find anything matching "${query.trim()}".`}
            />
          )}

          <div className="divide-y divide-border">
            {feed.map((a) => (
              <ThreadCard key={a.id} article={a} prefs={prefs} onShare={() => setSharing(a)} />
            ))}
          </div>

          {tab === "News" && !query.trim() && (
            <section className="mt-3 border-t border-border pt-2">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 sm:px-6">
                <h3 className="text-lg font-extrabold tracking-tight">Discover</h3>
                <div className="flex min-w-0 justify-end gap-3 overflow-x-auto no-scrollbar">
                  {DISCOVER_FILTERS.map((f) => (
                    <button
                      key={f}
                      onClick={() => setDiscover(f)}
                      className={cn(
                        "shrink-0 text-sm font-semibold",
                        discover === f ? "text-brand" : "text-muted-foreground",
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-3 grid auto-rows-[110px] grid-cols-2 gap-1 px-1 sm:auto-rows-[140px] sm:grid-cols-3">
                {photos.map((p, index) => (
                  <figure
                    key={p.id}
                    className={cn(
                      "overflow-hidden rounded-sm",
                      index % 7 === 0 && "row-span-2",
                      index % 7 === 3 && "col-span-2 row-span-2 sm:col-span-1",
                      index % 7 === 5 && "sm:col-span-2",
                    )}
                  >
                    <button
                      onClick={() => setViewing(p)}
                      aria-label={`Open ${p.category} photo full screen`}
                      className="block h-full w-full"
                    >
                      <img
                        src={imageUrl(p.key, "medium", p.aspect)}
                        alt={`${p.category} photo by ${byId.get(p.authorId)?.displayName ?? "WIZZ creator"}`}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-200 hover:scale-[1.03]"
                      />
                    </button>
                  </figure>
                ))}
              </div>
            </section>
          )}
          <div className="h-10" aria-hidden="true" />
        </div>

        {/* Right rail (wide desktop): trending */}
        <aside className="hidden border-l border-border p-4 xl:block">
          <p className="flex items-center gap-1.5 px-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <Flame className="size-3.5" /> Trending
          </p>
          <ul className="mt-2 space-y-1">
            {topics.slice(0, 6).map((t) => (
              <li key={t.tag}>
                <button
                  onClick={() => {
                    setQuery(`#${t.tag}`);
                    setScope("Most discussed");
                  }}
                  className="block w-full rounded-xl px-3 py-2 text-left hover:bg-secondary"
                >
                  <p className="text-sm font-bold">#{t.tag}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {(t.discussions / 1000).toFixed(1)}K discussions · {t.updates} updates
                  </p>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-4 px-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Ranked by
          </p>
          <p className="mt-1 px-2 text-[11px] leading-relaxed text-muted-foreground">
            Most discussed · most recent · most shared. Never editorial judgment.
          </p>
        </aside>
      </div>

      <ShareSheet
        open={sharing !== null}
        onClose={() => setSharing(null)}
        url={
          typeof window !== "undefined" && sharing
            ? `${window.location.origin}/news/${sharing.id}`
            : ""
        }
        message={sharing ? `${sharing.title} — ${sharing.sourceName} on WIZZ` : ""}
      />

      {viewing && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/95"
          role="dialog"
          aria-label="Photo viewer"
          onClick={() => setViewing(null)}
        >
          <div className="flex items-center justify-between px-4 pt-safe">
            <p className="truncate text-sm font-semibold text-white">
              {viewing.category} · by {byId.get(viewing.authorId)?.displayName ?? "WIZZ creator"}
            </p>
            <button
              aria-label="Close viewer"
              onClick={() => setViewing(null)}
              className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 text-xl font-bold text-white"
            >
              ×
            </button>
          </div>
          <div className="grid min-h-0 flex-1 place-items-center p-4">
            <img
              src={imageUrl(viewing.key, "large", viewing.aspect)}
              alt={`${viewing.category} photo full screen`}
              className="animate-scale-in max-h-full max-w-full rounded-2xl object-contain"
            />
          </div>
        </div>
      )}
    </AppShell>
  );
}

function EmptyBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="px-6 py-10 text-center">
      <p className="text-sm font-bold text-foreground">{title}</p>
      <p className="mx-auto mt-1 max-w-72 text-xs leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function ThreadCard({
  article: a,
  prefs,
  onShare,
}: {
  article: NewsArticle;
  prefs: ReturnType<typeof useNewsPrefs>;
  onShare: () => void;
}) {
  const liked = prefs.liked.includes(a.id);
  const saved = prefs.saved.includes(a.id);
  const reposted = prefs.reposted.includes(a.id);
  const followingSource = prefs.sources.includes(a.sourceName.toLowerCase());
  const likes = pseudo(a.id, 900, 60) + (liked ? 1 : 0);
  const reposts = pseudo(a.id, 380, 12) + (reposted ? 1 : 0);
  const firstTag = a.tags[0] ?? a.category.toLowerCase();
  const followingTopic = prefs.topics.includes(firstTag.toLowerCase());

  return (
    <article className="animate-fade-up px-4 py-4 sm:px-6">
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-black">
          {a.sourceName.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 truncate text-sm font-bold">
            {a.sourceName}
            <BadgeCheck className="size-3.5 shrink-0 text-brand" />
          </p>
          <p className="truncate text-xs text-muted-foreground">
            @{a.sourceHandle} · {timeAgo(a.publishedAt)}
          </p>
        </div>
        {!followingSource && (
          <button
            onClick={() => prefs.toggleSource(a.sourceName)}
            className="shrink-0 rounded-full px-3 py-1.5 text-xs font-bold text-brand hover:bg-brand-soft"
          >
            Follow
          </button>
        )}
      </div>

      <Link to="/news/$articleId" params={{ articleId: a.id }} className="group mt-2.5 block">
        {a.live && (
          <span className="mb-1.5 inline-flex items-center gap-1.5 rounded-md bg-live/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-live">
            <span className="size-1.5 animate-pulse rounded-full bg-live" /> Breaking
            {a.updates.length > 0 ? ` · ${a.updates.length} updates` : ""}
          </span>
        )}
        <h3 className="text-[17px] font-extrabold leading-snug tracking-tight group-hover:underline">
          {a.title}
        </h3>
        <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {a.summary}
        </p>
        <span className="mt-2.5 block overflow-hidden rounded-2xl border border-border">
          <img
            src={imageUrl(a.imageKey, "medium", 16 / 10)}
            alt={a.title}
            loading="lazy"
            className="aspect-[16/10] w-full object-cover"
          />
        </span>
        <p className="mt-2 text-xs text-muted-foreground">
          {a.location} · {a.readMinutes} min read
        </p>
      </Link>

      <div className="mt-2 flex items-center gap-1">
        <button
          onClick={() => prefs.toggleLiked(a.id)}
          aria-label="Like story"
          aria-pressed={liked}
          className="press flex items-center gap-1.5 rounded-full px-2.5 py-1.5 hover:bg-secondary"
        >
          <Heart
            className={cn("size-4", liked ? "fill-live text-live" : "text-muted-foreground")}
          />
          <span className="text-xs font-semibold text-muted-foreground">
            {compact.format(likes)}
          </span>
        </button>
        <Link
          to="/news/$articleId"
          params={{ articleId: a.id }}
          aria-label="Discuss"
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 hover:bg-secondary"
        >
          <MessageCircle className="size-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground">
            {compact.format(discussionCount(a.id))}
          </span>
        </Link>
        <button
          onClick={() => prefs.toggleReposted(a.id)}
          aria-label="Repost"
          aria-pressed={reposted}
          className="press flex items-center gap-1.5 rounded-full px-2.5 py-1.5 hover:bg-secondary"
        >
          <Repeat2 className={cn("size-4", reposted ? "text-brand" : "text-muted-foreground")} />
          <span className="text-xs font-semibold text-muted-foreground">
            {compact.format(reposts)}
          </span>
        </button>
        <button
          onClick={onShare}
          aria-label="Share"
          className="rounded-full p-2 hover:bg-secondary"
        >
          <Share2 className="size-4 text-muted-foreground" />
        </button>
        <span className="flex-1" />
        <button
          onClick={() => prefs.toggleSaved(a.id)}
          aria-label={saved ? "Unsave" : "Save"}
          aria-pressed={saved}
          className="press rounded-full p-2 hover:bg-secondary"
        >
          <Bookmark
            className={cn("size-4", saved ? "fill-brand text-brand" : "text-muted-foreground")}
          />
        </button>
        <button
          onClick={() => prefs.toggleTopic(firstTag)}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-bold",
            followingTopic ? "bg-brand-soft text-brand" : "bg-secondary text-muted-foreground",
          )}
        >
          {followingTopic ? "Following" : `#${firstTag}`}
        </button>
      </div>
      {a.updates.length > 0 && (
        <Link
          to="/news/$articleId"
          params={{ articleId: a.id }}
          className="mt-1.5 inline-flex items-center gap-1 px-1 text-xs font-bold text-brand"
        >
          <Bell className="size-3.5" />
          {a.live ? "Following this story" : `${a.updates.length} updates`} →
        </Link>
      )}
    </article>
  );
}

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

export function NewsPending() {
  return (
    <AppShell title="News">
      <div className="space-y-4 px-4 pt-4 sm:px-6">
        <div className="h-9 w-full animate-pulse rounded-full bg-secondary" />
        {[0, 1, 2].map((i) => (
          <div key={i}>
            <div className="flex items-center gap-2.5">
              <div className="size-9 animate-pulse rounded-full bg-secondary" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-1/3 animate-pulse rounded bg-secondary" />
                <div className="h-3 w-1/4 animate-pulse rounded bg-secondary" />
              </div>
            </div>
            <div className="mt-2.5 h-5 w-11/12 animate-pulse rounded bg-secondary" />
            <div className="mt-1.5 aspect-[16/10] w-full animate-pulse rounded-2xl bg-secondary" />
          </div>
        ))}
      </div>
    </AppShell>
  );
}

export function NewsError({ reset }: { reset: () => void }) {
  return (
    <AppShell title="News">
      <div className="px-6 py-16 text-center">
        <p className="text-base font-bold">Unable to load news</p>
        <p className="mt-1 text-sm text-muted-foreground">Something went wrong. Try again.</p>
        <button
          onClick={reset}
          className="mt-4 rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-brand-foreground"
        >
          Retry
        </button>
      </div>
    </AppShell>
  );
}
