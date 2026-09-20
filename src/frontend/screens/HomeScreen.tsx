import { useCallback, useEffect, useRef, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { fetchFeedPage } from "@/backend/api/home.functions";
import type { FeedItem } from "@/backend/services/feedService";
import { homeQueryOptions } from "@/frontend/queries/home";
import { TopBar } from "@/frontend/components/home/TopBar";
import { StoryRail } from "@/frontend/components/home/StoryRail";
import { FeedCard } from "@/frontend/components/home/FeedCard";
import { BottomNav } from "@/frontend/components/home/BottomNav";

export function HomeScreen() {
  const { data } = useSuspenseQuery(homeQueryOptions);
  const loadPage = useServerFn(fetchFeedPage);

  const [extra, setExtra] = useState<FeedItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(data.feed.nextCursor);
  const [hasMore, setHasMore] = useState(data.feed.hasMore);
  const [loading, setLoading] = useState(false);
  const sentinel = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !cursor) return;
    setLoading(true);
    try {
      const page = await loadPage({ data: { cursor } });
      setExtra((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [cursor, hasMore, loading, loadPage]);

  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) void loadMore();
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [loadMore]);

  const items = [...data.feed.items, ...extra];

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-3xl flex-col bg-background md:border-x md:border-border">
      <TopBar />
      <main className="min-w-0 flex-1 pb-24 sm:pb-28">
        <h1 className="sr-only">WIZZ home feed</h1>
        <StoryRail currentUser={data.currentUser} stories={data.stories} />
        {items.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-semibold text-foreground">No posts yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Be the first to share something on WIZZ.
            </p>
          </div>
        )}
        {items.map((item) => (
          <FeedCard key={item.post.id} item={item} />
        ))}
        <div ref={sentinel} className="grid h-16 place-items-center">
          {loading && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
          {!hasMore && !loading && (
            <p className="text-xs text-muted-foreground">You're all caught up</p>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
