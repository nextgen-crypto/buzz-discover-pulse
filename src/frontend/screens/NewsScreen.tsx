import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { creators, explorePhotos } from "@/backend/database/seed";
import { imageUrl } from "@/backend/domain/media";
import { newsQueryOptions } from "@/frontend/queries/sections";
import { AppShell } from "@/frontend/components/AppShell";
import { cn } from "@/lib/utils";

const REFERENCE_NOW = Date.parse("2026-08-27T12:00:00.000Z");
function timeAgo(iso: string): string {
  const mins = Math.max(1, Math.round((REFERENCE_NOW - Date.parse(iso)) / 60_000));
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

const tabs = ["Latest", "Technology", "Sports", "Entertainment", "Travel"] as const;
const discoverFilters = ["All", "Travel", "Design", "Food", "Sports"] as const;

export function NewsScreen() {
  const { data: articles } = useSuspenseQuery(newsQueryOptions);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Latest");
  const [discover, setDiscover] = useState<(typeof discoverFilters)[number]>("All");
  const [expanded, setExpanded] = useState(false);

  const scoped = useMemo(
    () => (tab === "Latest" ? articles : articles.filter((a) => a.category === tab)),
    [articles, tab],
  );
  const hero = scoped.find((a) => a.live) ?? scoped[0] ?? articles[0];
  const stories = (hero ? scoped.filter((a) => a.id !== hero.id) : scoped).slice(0, expanded ? 12 : 3);

  const photos = useMemo(
    () => (discover === "All" ? explorePhotos : explorePhotos.filter((p) => p.category === discover)),
    [discover],
  );

  const byId = useMemo(() => new Map(creators.map((c) => [c.id, c])), []);

  return (
    <AppShell title="Explore">
      <header className="px-4 pt-4 sm:px-6 sm:pt-6">
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground">Explore</h2>
        <p className="mt-1 text-sm text-muted-foreground">What&apos;s happening right now.</p>
      </header>

      {/* Pill tabs */}
      <div className="mt-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar sm:px-6">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              tab === t
                ? "bg-brand text-primary-foreground"
                : "border border-border bg-transparent text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Hero */}
      <section className="mt-4">
        <h3 className="px-4 pb-2 text-lg font-extrabold tracking-tight text-foreground">
          What&apos;s happening
        </h3>
        {hero && (
           <article className="relative mx-4 overflow-hidden rounded-2xl bg-surface-strong sm:mx-6">
            <img
              src={imageUrl(hero.imageKey, "large", 16 / 10)}
              alt={hero.title}
              className="aspect-[16/10] w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-scrim via-scrim/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-on-media/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-on-media backdrop-blur">
                {hero.category}
                {hero.live && <span className="text-live">· LIVE</span>}
              </span>
              <h4 className="mt-2 text-lg font-bold leading-snug text-on-media">{hero.title}</h4>
              <p className="mt-1 text-xs text-on-media/80">
                {hero.sourceName} · {timeAgo(hero.publishedAt)}
              </p>
            </div>
          </article>
        )}
      </section>

      {/* Article rows with thumbnails */}
       <ul className="mt-1 grid md:grid-cols-2 md:px-2">
        {stories.map((a) => (
          <li key={a.id} className="flex items-start gap-3 px-4 py-3.5">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">
                {a.category} · {a.sourceName}
              </p>
              <h4 className="mt-1 text-[15px] font-bold leading-snug text-foreground">{a.title}</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                {timeAgo(a.publishedAt)} · {2 + (a.summary.length % 6)} min read
              </p>
            </div>
            <img
              src={imageUrl(a.imageKey, "thumbnail", 0.8)}
              alt={a.title}
              loading="lazy"
              className="size-16 shrink-0 rounded-xl object-cover"
            />
          </li>
        ))}
      </ul>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="px-4 pb-2 pt-1 text-sm font-bold text-brand"
      >
        {expanded ? "Show less" : "Show more"}
      </button>

      {/* Discover */}
      <section className="mt-3">
         <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 sm:px-6">
          <h3 className="text-lg font-extrabold tracking-tight text-foreground">Discover</h3>
           <div className="flex min-w-0 justify-end gap-3 overflow-x-auto no-scrollbar">
            {discoverFilters.map((f) => (
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
              <img
                src={imageUrl(p.key, "medium", p.aspect)}
                alt={`${p.category} photo by ${byId.get(p.authorId)?.displayName ?? "BUZZ creator"}`}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </figure>
          ))}
        </div>
      </section>
      <div className="h-28" aria-hidden="true" />
    </AppShell>
  );
}
