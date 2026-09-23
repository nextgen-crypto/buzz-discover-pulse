import { useEffect, useMemo, useState } from "react";
import { Link, useSearch } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { MoreHorizontal, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { creators, explorePhotos } from "@/backend/database/seed";
import { imageUrl } from "@/backend/domain/media";
import { AppShell } from "@/frontend/components/AppShell";
import { StoryListItem } from "@/frontend/components/news/StoryListItem";
import { formatCount } from "@/frontend/components/news/newsFormat";
import { newsStoriesQueryOptions } from "@/frontend/hooks/useNewsStories";
import { trendingTopicsQueryOptions } from "@/frontend/hooks/useTrendingTopics";
import { useNewsPrefs } from "@/frontend/hooks/useNewsPrefs";
import { cn } from "@/lib/utils";

const TABS = ["Latest", "Following", "Saved"] as const;
const DISCOVER_FILTERS = ["All", "Travel", "Design", "Food", "Sports"] as const;

/** Screen 1 — Today's News: heading, search, flat story list, trending. */
export function NewsScreen() {
  // Suspense: the route loader provides identical data on server and client,
  // so first paint can never disagree (hydration-safe).
  const { data } = useSuspenseQuery(newsStoriesQueryOptions);
  const stories = data?.stories ?? [];
  const live = data?.live ?? false;
  const { data: trends = [] } = useSuspenseQuery(trendingTopicsQueryOptions);
  const prefs = useNewsPrefs();
  const { q } = useSearch({ from: "/news" });

  const [tab, setTab] = useState<(typeof TABS)[number]>("Latest");
  const [query, setQuery] = useState(q ?? "");
  const [hiddenTrends, setHiddenTrends] = useState<string[]>([]);
  const [mutedTrends, setMutedTrends] = useState<string[]>([]);
  const [discover, setDiscover] = useState<(typeof DISCOVER_FILTERS)[number]>("All");
  const [viewing, setViewing] = useState<(typeof explorePhotos)[number] | null>(null);
  // Browser-only prefs (localStorage) don't exist during SSR — ignore them
  // on the first render so hydration matches the server HTML exactly.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const feed = useMemo(() => {
    const needle = (q || query).trim().toLowerCase();
    let list = [...stories];
    if (!mounted) {
      return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    if (needle) {
      const words = needle.split(/\s+/);
      return list
        .map((s) => {
          const hay = `${s.headline} ${s.summary} ${s.category}`.toLowerCase();
          return { s, hits: words.filter((w) => hay.includes(w)).length };
        })
        .filter((x) => x.hits > 0)
        .sort((a, b) => b.hits - a.hits || b.s.postCount - a.s.postCount)
        .map((x) => x.s);
    }
    if (tab === "Following") {
      const followed = [...prefs.topics, ...prefs.sources, ...loadIds("wizz:news-stories-followed")];
      list = list.filter(
        (s) =>
          followed.includes(s.id) ||
          followed.includes(s.category.toLowerCase()) ||
          followed.includes(s.headline.toLowerCase()),
      );
    }
    if (tab === "Saved") {
      list = list.filter((s) => prefs.saved.includes(s.id) || loadIds("wizz:news-saved").includes(s.id));
    }
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [stories, tab, query, q, prefs, mounted]);

  const visibleTrends = trends.filter(
    (t) => !hiddenTrends.includes(t.id) && !mutedTrends.includes(t.id),
  );

  const needle = (q || query).trim().toLowerCase();
  const { data: people = [] } = useQuery({
    queryKey: ["news-search-people", needle],
    enabled: needle.length >= 2,
    staleTime: 30_000,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, verified")
        .or(`username.ilike.%${needle}%,display_name.ilike.%${needle}%`)
        .limit(6);
      if (error) throw error;
      return (data ?? []) as {
        id: string;
        username: string;
        display_name: string;
        avatar_url: string | null;
        verified: boolean;
      }[];
    },
  });
  const matchingTrends = needle.length >= 2 ? visibleTrends : [];

  const byId = useMemo(() => new Map(creators.map((c) => [c.id, c])), []);
  const photos = useMemo(
    () =>
      discover === "All" ? explorePhotos : explorePhotos.filter((p) => p.category === discover),
    [discover],
  );

  return (
    <AppShell title="News">
      <div className="mx-auto w-full max-w-2xl">
        <div className="px-4 pt-3">
          <h1 className="text-xl font-black tracking-tight text-foreground">Today&apos;s News</h1>
          <div className="mt-2.5 flex items-center gap-2 rounded-full bg-secondary px-3.5 py-2.5">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search stories, topics, people"
              aria-label="Search stories, topics, people"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="mt-1 flex gap-5 border-b border-border">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                aria-pressed={tab === t}
                className={cn(
                  "relative py-2.5 text-sm",
                  tab === t ? "font-bold text-foreground" : "font-medium text-muted-foreground",
                )}
              >
                {t}
                {tab === t && (
                  <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-foreground" />
                )}
              </button>
            ))}
          </div>
        </div>

        {!live && stories.length > 0 && (
          <p className="px-4 pt-2 text-[11px] text-muted-foreground">
            Live topics from posts — run part8_news.sql for curated stories.
          </p>
        )}
        {needle.length >= 2 && (people.length > 0 || matchingTrends.length > 0) && (
          <>
            {people.length > 0 && (
              <section className="border-b border-border" aria-label="People">
                <h2 className="px-4 pb-1 pt-3 text-sm font-extrabold text-foreground">People</h2>
                <div className="divide-y divide-border">
                  {people.map((p) => (
                    <Link
                      key={p.id}
                      to="/u/$username"
                      params={{ username: p.username }}
                      className="flex items-center gap-3 px-4 py-2.5"
                    >
                      {p.avatar_url ? (
                        <img
                          src={p.avatar_url}
                          alt={p.display_name}
                          loading="lazy"
                          className="size-9 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-foreground">
                          {p.display_name.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-foreground">
                          {p.display_name}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          @{p.username}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
            {matchingTrends.length > 0 && (
              <section className="border-b border-border" aria-label="Topics">
                <h2 className="px-4 pb-1 pt-3 text-sm font-extrabold text-foreground">Topics</h2>
                <div className="flex flex-wrap gap-1.5 px-4 pb-3">
                  {matchingTrends.slice(0, 8).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setQuery(t.label)}
                      className="rounded-full bg-secondary px-3.5 py-1.5 text-xs font-bold text-foreground"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
        {feed.length === 0 ? (
          <EmptyState
            title={
              tab === "Saved"
                ? "No saved stories"
                : tab === "Following"
                  ? "Nothing from your follows yet"
                  : "No stories found"
            }
            body={
              tab === "Saved"
                ? "Save any story from its ••• menu to build your reading list."
                : tab === "Following"
                  ? "Follow topics and stories to fill this feed."
                  : "Try different words or check back later."
            }
          />
        ) : (
          <div className="divide-y divide-border">
            {feed.map((s) => (
              <StoryListItem key={s.id} story={s} />
            ))}
          </div>
        )}

        {visibleTrends.length > 0 && (
          <section className="mt-2 border-t border-border pt-1" aria-label="Trending">
            <h2 className="px-4 pb-1 pt-3 text-sm font-extrabold text-foreground">Trending</h2>
            <div className="divide-y divide-border">
              {visibleTrends.map((t) => (
                <TrendRow
                  key={t.id}
                  label={t.label}
                  context={t.context || "Trending"}
                  count={t.postCount}
                  followed={prefs.topics.includes(t.label.replace(/^#/, "").toLowerCase())}
                  onFollow={() => prefs.toggleTopic(t.label)}
                  onHide={() => setHiddenTrends((prev) => [...prev, t.id])}
                  onMute={() => setMutedTrends((prev) => [...prev, t.id])}
                />
              ))}
            </div>
          </section>
        )}

        <section className="mt-2 border-t border-border pt-1" aria-label="Discover">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4">
            <h2 className="pb-1 pt-3 text-sm font-extrabold text-foreground">Discover</h2>
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
        <div className="h-24" aria-hidden="true" />
      </div>

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

function loadIds(key: string): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(key) ?? "[]") as unknown;
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function TrendRow({
  label,
  context,
  count,
  followed,
  onFollow,
  onHide,
  onMute,
}: {
  label: string;
  context: string;
  count: number;
  followed: boolean;
  onFollow: () => void;
  onHide: () => void;
  onMute: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="flex items-center gap-2 px-4 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{label}</p>
        <p className="truncate text-xs text-muted-foreground">
          {context}
          {count > 0 ? ` · ${formatCount(count)} posts` : ""}
          {followed ? " · Following" : ""}
        </p>
      </div>
      <span className="relative shrink-0">
        <button
          aria-label={`Options for ${label}`}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          className="rounded-full p-1.5 hover:bg-secondary"
        >
          <MoreHorizontal className="size-4 text-muted-foreground" />
        </button>
        {menuOpen && (
          <>
            <button
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-10 cursor-default"
            />
            <div className="absolute right-0 top-8 z-20 w-44 overflow-hidden rounded-2xl border border-border bg-card shadow-raise">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onFollow();
                }}
                className="block w-full px-3 py-2.5 text-left text-sm font-medium hover:bg-secondary"
              >
                {followed ? "Unfollow topic" : "Follow topic"}
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onHide();
                }}
                className="block w-full px-3 py-2.5 text-left text-sm font-medium hover:bg-secondary"
              >
                Not interested
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onMute();
                }}
                className="block w-full px-3 py-2.5 text-left text-sm font-medium hover:bg-secondary"
              >
                Mute this trend
              </button>
            </div>
          </>
        )}
      </span>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="px-6 py-10 text-center">
      <p className="text-sm font-bold text-foreground">{title}</p>
      <p className="mx-auto mt-1 max-w-72 text-xs leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

export function NewsPending() {
  return (
    <AppShell title="News">
      <div className="mx-auto w-full max-w-2xl space-y-3 px-4 pt-4">
        <div className="h-7 w-40 animate-pulse rounded bg-secondary" />
        <div className="h-10 w-full animate-pulse rounded-full bg-secondary" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-2 py-2">
            <div className="h-4 w-11/12 animate-pulse rounded bg-secondary" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-secondary" />
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
