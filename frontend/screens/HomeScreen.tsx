import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { fetchFeedPage } from "@/backend/api/home.functions";
import type { FeedItem } from "@/backend/services/feedService";
import { homeQueryOptions, personalFeedQueryOptions } from "@/frontend/queries/home";
import { TopBar } from "@/frontend/components/home/TopBar";
import { StoryRail } from "@/frontend/components/home/StoryRail";
import { FeedCard } from "@/frontend/components/home/FeedCard";
import { BottomNav } from "@/frontend/components/home/BottomNav";
import { useAds } from "@/frontend/components/ads/ads";
import { SponsoredCard } from "@/frontend/components/ads/SponsoredCard";
import { SponsoredPostCard, usePromotions } from "@/frontend/components/ads/SponsoredPostCard";
import { useShowcase } from "@/frontend/components/showcase/showcase";
import { ShowcaseCarousel } from "@/frontend/components/showcase/ShowcaseCarousel";
import { useSession } from "@/frontend/hooks/useSession";
import { useMyProfile } from "@/frontend/hooks/useMyProfile";
import { useSavedPosts } from "@/frontend/hooks/useSavedPosts";
import { useFollowList } from "@/frontend/hooks/usePublicProfile";
import { buildInterestProfile, useFeedPrefs } from "@/frontend/hooks/useFeedPrefs";
import { useEventTracker } from "@/frontend/hooks/useEventTracker";
import { toast } from "sonner";

export function HomeScreen() {
  const { data: base } = useSuspenseQuery(homeQueryOptions);
  const loadPage = useServerFn(fetchFeedPage);

  const { user, loading: sessionLoading } = useSession();
  const userId = user?.id ?? null;
  const { data: myProfile } = useMyProfile(userId);
  const { data: savedPosts = [] } = useSavedPosts(userId);
  const { data: following = [] } = useFollowList(myProfile?.id ?? null, "following", userId);
  const prefs = useFeedPrefs(userId);
  const { track } = useEventTracker(userId);

  // Viewer taste: follows + saves + mutes + hides + watch history.
  // Cold start: onboarding picks count as saved categories until real signals arrive.
  const profile = useMemo(() => {
    let onboard: string[] = [];
    try {
      const raw = JSON.parse(localStorage.getItem("wizz:onboard-interests") ?? "{}") as {
        categories?: unknown;
      };
      if (Array.isArray(raw.categories)) {
        onboard = raw.categories.filter((c): c is string => typeof c === "string");
      }
    } catch {
      // ignore
    }
    const built = buildInterestProfile({
      followingIds: following.map((f) => f.id),
      savedPosts,
      muted: prefs.muted,
      hidden: prefs.hidden,
      notInterested: prefs.notInterested,
      watched: prefs.watched,
    });
    return {
      ...built,
      savedCategories: [
        ...new Set([...built.savedCategories, ...onboard.map((c) => c.toLowerCase())]),
      ],
    };
  }, [following, savedPosts, prefs.muted, prefs.hidden, prefs.notInterested, prefs.watched]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Personalized first page replaces the generic SSR page once ready. Story
  // state is separate because the viewer-specific query also refreshes it.
  const [storyRail, setStoryRail] = useState(base.stories);
  const [storyViewerId, setStoryViewerId] = useState<string | null>(null);
  const [feed, setFeed] = useState<FeedItem[] | null>(null);
  const [feedViewerId, setFeedViewerId] = useState<string | null>(null);
  const [extra, setExtra] = useState<FeedItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(base.feed.nextCursor);
  const [hasMore, setHasMore] = useState(base.feed.hasMore);
  const [loading, setLoading] = useState(false);
  const sentinel = useRef<HTMLDivElement | null>(null);
  const feedRequestVersion = useRef(0);

  const { data: personal } = useQuery({
    ...personalFeedQueryOptions(profile, userId),
    enabled: mounted && !sessionLoading,
  });

  useEffect(() => {
    feedRequestVersion.current += 1;
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!personal) return;
    feedRequestVersion.current += 1;
    setStoryRail(personal.stories);
    setStoryViewerId(userId);
    setFeed(personal.feed.items);
    setFeedViewerId(userId);
    setCursor(personal.feed.nextCursor);
    setHasMore(personal.feed.hasMore);
    setExtra([]);
  }, [personal, userId]);

  const loadMore = useCallback(async () => {
    if (feedViewerId !== userId || loading || !hasMore || !cursor) return;
    const requestVersion = ++feedRequestVersion.current;
    setLoading(true);
    try {
      const page = await loadPage({ data: { cursor, profile } });
      if (requestVersion !== feedRequestVersion.current || feedViewerId !== userId) return;
      setExtra((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } catch {
      if (requestVersion === feedRequestVersion.current) setHasMore(false);
    } finally {
      if (requestVersion === feedRequestVersion.current) setLoading(false);
    }
  }, [cursor, feedViewerId, hasMore, loading, loadPage, profile, userId]);

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

  function removePost(postId: string) {
    setFeed((prev) => (prev ? prev.filter((i) => i.post.id !== postId) : prev));
    setExtra((prev) => prev.filter((i) => i.post.id !== postId));
  }

  function removeAuthor(authorId: string) {
    setFeed((prev) => (prev ? prev.filter((i) => i.author.id !== authorId) : prev));
    setExtra((prev) => prev.filter((i) => i.author.id !== authorId));
  }

  const personalFeedReady = feedViewerId === userId;
  const items = personalFeedReady ? [...(feed ?? base.feed.items), ...extra] : base.feed.items;
  const visibleStoryRail = storyViewerId === userId ? storyRail : base.stories;
  const ads = useAds();
  const slides = useShowcase();
  const { data: promotions = [] } = usePromotions(userId);
  const [hiddenPromos, setHiddenPromos] = useState<string[]>([]);
  const livePromos = promotions.filter((p) => !hiddenPromos.includes(p.campaignId));

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-3xl flex-col bg-background md:border-x md:border-border">
      <TopBar />
      <main className="min-w-0 flex-1 pb-24 sm:pb-28">
        <h1 className="sr-only">WIZZ home feed</h1>
        <StoryRail
          currentUser={base.currentUser}
          currentUserAvatar={myProfile?.avatar_url}
          currentUserUsername={myProfile?.username}
          stories={visibleStoryRail}
        />
        {slides.length > 0 && <ShowcaseCarousel slides={slides} />}
        {items.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-semibold text-foreground">No posts yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Be the first to share something on WIZZ.
            </p>
          </div>
        )}
        {items.map((item, i) => (
          <div key={item.post.id}>
            <FeedCard
              item={item}
              index={i}
              track={track}
              onWatch={(postId, completed) => prefs.recordWatch(postId, completed)}
              onHidePost={(postId) => {
                prefs.hidePost(postId);
                track("hide", postId, { authorId: item.author.id });
                removePost(postId);
              }}
              onNotInterested={(postId) => {
                prefs.markNotInterested(postId);
                track("not_interested", postId, { authorId: item.author.id });
              }}
              onMuteAuthor={(authorId, username) => {
                prefs.muteAuthor(authorId, username);
                track("creator_mute", item.post.id, { authorId });
                removeAuthor(authorId);
                toast(`Muted @${username}`, {
                  action: { label: "Undo", onClick: () => prefs.unmuteAuthor(authorId) },
                });
              }}
            />
            {livePromos.length > 0 && i % 5 === 4
              ? (() => {
                  const promo = livePromos[Math.floor(i / 5) % livePromos.length]!;
                  return (
                    <SponsoredPostCard
                      promo={promo}
                      viewerId={userId}
                      onHide={(campaignId) => setHiddenPromos((prev) => [...prev, campaignId])}
                      onMuteAuthor={(authorId, username) => {
                        prefs.muteAuthor(authorId, username);
                        track("creator_mute", promo.post.id, { authorId });
                        removeAuthor(authorId);
                        setHiddenPromos((prev) => [...prev, promo.campaignId]);
                        toast(`Muted @${username}`, {
                          action: { label: "Undo", onClick: () => prefs.unmuteAuthor(authorId) },
                        });
                      }}
                    />
                  );
                })()
              : ads.length > 0 &&
                livePromos.length === 0 &&
                i % 4 === 3 && <SponsoredCard ad={ads[Math.floor(i / 4) % ads.length]!} />}
          </div>
        ))}
        <div ref={sentinel} className="grid h-16 place-items-center">
          {loading && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
          {!hasMore && !loading && (
            <p className="text-xs text-muted-foreground">You&apos;re all caught up</p>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
