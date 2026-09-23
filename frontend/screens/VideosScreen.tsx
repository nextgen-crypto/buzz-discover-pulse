import { Fragment, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { videosQueryOptions } from "@/frontend/queries/sections";
import { AppShell } from "@/frontend/components/AppShell";
import { VideoCard } from "@/frontend/components/videos/VideoCard";
import { useAds } from "@/frontend/components/ads/ads";
import { SponsoredCard } from "@/frontend/components/ads/SponsoredCard";
import { cn } from "@/lib/utils";

export function VideosScreen() {
  const { data } = useSuspenseQuery(videosQueryOptions);
  const [category, setCategory] = useState("For You");
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(6);
  const categories = Array.from(new Set(["For You", ...data.map((v) => v.video.category)]));
  const q = query.trim().toLowerCase();
  const filtered = data.filter((v) => {
    if (category !== "For You" && v.video.category !== category) return false;
    if (!q) return true;
    return (
      v.video.title.toLowerCase().includes(q) ||
      v.authorName.toLowerCase().includes(q) ||
      v.video.category.toLowerCase().includes(q) ||
      v.video.tags.some((t) => t.toLowerCase().includes(q))
    );
  });
  const shown = filtered.slice(0, visible);
  const continueWatching = data.filter((v) => v.video.progressSeconds);
  const ads = useAds();

  return (
    <AppShell title="Videos">
      <div className="px-4 pt-3 sm:px-6">
        <div className="flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-2.5">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setVisible(6);
            }}
            placeholder="Search videos, creators, tags"
            aria-label="Search videos"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>
      <div className="rail flex gap-2 px-4 py-3 sm:px-6">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => {
              setCategory(c);
              setVisible(6);
            }}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-semibold",
              c === category
                ? "bg-brand text-brand-foreground"
                : "border border-border bg-background text-foreground",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {continueWatching.length > 0 && (
        <section className="pt-1">
          <h3 className="px-4 pb-2 text-sm font-bold text-foreground sm:px-6">Continue watching</h3>
          <div className="rail flex gap-3 px-4 pb-2 sm:px-6">
            {continueWatching.map((item) => (
              <VideoCard key={item.video.id} item={item} variant="rail" />
            ))}
          </div>
        </section>
      )}

      <section className="pt-2">
        <h3 className="px-4 pb-2 text-sm font-bold text-foreground sm:px-6">Recommended</h3>
        {shown.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground sm:px-6">
            No videos match “{query || category}”. Try another search.
          </p>
        ) : (
          <ul className="grid md:grid-cols-2">
            {shown.map((item, i) => (
              <Fragment key={item.video.id}>
                <li>
                  <VideoCard item={item} variant="grid" />
                </li>
                {ads.length > 0 && i % 4 === 3 && (
                  <li key={`ad-${item.video.id}`} className="px-4 pb-4 sm:px-6 md:px-3">
                    <SponsoredCard ad={ads[Math.floor(i / 4) % ads.length]!} />
                  </li>
                )}
              </Fragment>
            ))}
          </ul>
        )}
        {visible < filtered.length && (
          <button
            onClick={() => setVisible((v) => v + 6)}
            className="mx-auto mb-6 mt-2 block rounded-full bg-secondary px-6 py-2.5 text-sm font-semibold text-foreground"
          >
            Show more
          </button>
        )}
      </section>
    </AppShell>
  );
}

export function VideosPending() {
  return (
    <AppShell title="Videos">
      <div className="px-4 pt-3 sm:px-6">
        <div className="h-11 w-full animate-pulse rounded-full bg-secondary" />
      </div>
      <div className="flex gap-2 px-4 py-3 sm:px-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-9 w-24 shrink-0 animate-pulse rounded-full bg-secondary" />
        ))}
      </div>
      <div className="grid gap-4 px-4 sm:px-6 md:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i}>
            <div className="aspect-video w-full animate-pulse rounded-2xl bg-secondary" />
            <div className="mt-2.5 flex gap-3">
              <div className="size-9 shrink-0 animate-pulse rounded-full bg-secondary" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3.5 w-3/4 animate-pulse rounded bg-secondary" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-secondary" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
