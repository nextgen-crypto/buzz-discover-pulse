import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useRouter } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronLeft, Flag, Loader2, MoreHorizontal, Share2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/frontend/components/AppShell";
import { formatCount, newsTimeAgo } from "@/frontend/components/news/newsFormat";
import { RelevantPersonRow } from "@/frontend/components/news/RelevantPersonRow";
import { StoryPostCard } from "@/frontend/components/news/StoryPostCard";
import { TopLatestTabs } from "@/frontend/components/news/TopLatestTabs";
import {
  storyQueryOptions,
  useRelevantPeople,
  useStoryFlags,
  useStoryLiveCount,
  useStoryPosts,
  type StoryTab,
} from "@/frontend/hooks/useStoryDetail";
import { ShareSheet } from "@/frontend/components/overlays/ShareSheet";
import { ReportDialog } from "@/frontend/components/moderation/ReportDialog";
import { useSession } from "@/frontend/hooks/useSession";

/**
 * Screens 2+3 on one route: story header, wrapping headline, expandable
 * summary, disclaimer, Top/Latest tabs, keyset-paginated posts (never
 * auto-inserted — new rows sit behind a pill), Relevant people. Back
 * restores the list position via router scroll restoration.
 */
export function NewsThreadScreen() {
  const { articleId: storyId } = useParams({ from: "/news/$articleId" });
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useSession();
  const userId = user?.id ?? null;

  const { data: story } = useSuspenseQuery(storyQueryOptions(storyId));
  const [tab, setTab] = useState<StoryTab>("Top");
  const posts = useStoryPosts(storyId, tab);
  const { data: people = [] } = useRelevantPeople(storyId);
  const flags = useStoryFlags(storyId, userId);
  const { fresh, reset } = useStoryLiveCount(storyId, true);

  const [summaryOpen, setSummaryOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [mutedAuthors, setMutedAuthors] = useState<string[]>([]);
  const sentinel = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setTab("Top");
    setSummaryOpen(false);
    setMenuOpen(false);
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId]);

  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && posts.hasNextPage && !posts.isFetchingNextPage) {
          void posts.fetchNextPage();
        }
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [posts]);

  if (!story) {
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

  const short = story.summaryShort || story.summary.slice(0, 160);
  const cut = !summaryOpen && story.summary.length > short.length;
  const items = (posts.data?.pages ?? []).flatMap((p) => p.items);
  const visible = items.filter((p) => !mutedAuthors.includes(p.author?.id ?? ""));
  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/news/${story.id}` : "";

  function copyLink() {
    try {
      void navigator.clipboard.writeText(shareUrl);
      toast("Link copied.");
    } catch {
      toast("Could not copy link.");
    }
  }

  const menu: { label: string; fn: () => void }[] = [
    {
      label: flags.followed ? "Unfollow story" : "Follow this story",
      fn: () => {
        if (!userId) {
          toast.error("Sign in to follow stories.");
          return;
        }
        flags.setFollowed(!flags.followed);
        toast(flags.followed ? "Unfollowed story." : "Following — updates land in News → Following.");
      },
    },
    {
      label: flags.saved ? "Unsave story" : "Save story",
      fn: () => {
        if (!userId) {
          toast.error("Sign in to save stories.");
          return;
        }
        flags.setSaved(!flags.saved);
        toast(flags.saved ? "Removed from saved." : "Saved — find it in Profile → Saved → News.");
      },
    },
    { label: "Share story", fn: () => setSharing(true) },
    { label: "Copy link", fn: copyLink },
    {
      label: "Not interested",
      fn: () => {
        toast("We'll show less like this.");
        void navigate({ to: "/news" });
      },
    },
    { label: "Report", fn: () => setReporting(true) },
  ];

  return (
    <AppShell title={story.headline}>
      <div className="mx-auto w-full max-w-xl">
        <div className="sticky top-14 z-20 flex items-center gap-1 border-b border-border bg-background/95 px-2 py-1.5 backdrop-blur">
          <button
            onClick={() => {
              // Step back when there is in-app history; a cold start, deep
              // link, or WebView with a single entry would otherwise exit.
              if (router.history.canGoBack()) router.history.back();
              else void navigate({ to: "/news" });
            }}
            aria-label="Back"
            className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-secondary"
          >
            <ChevronLeft className="size-5" />
          </button>
          <span className="min-w-0 flex-1 truncate text-sm font-bold">{story.headline}</span>
          <button
            onClick={() => setReporting(true)}
            aria-label="Report story"
            className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-secondary"
          >
            <Flag className="size-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => setSharing(true)}
            aria-label="Share story"
            className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-secondary"
          >
            <Share2 className="size-4 text-muted-foreground" />
          </button>
          <span className="relative shrink-0">
            <button
              aria-label="Story options"
              aria-expanded={menuOpen}
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
                <div className="absolute right-0 top-10 z-20 w-52 overflow-hidden rounded-2xl border border-border bg-card shadow-raise">
                  {menu.map(({ label, fn }) => (
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

        <div className="px-4 pt-3">
          <h1 className="text-2xl font-black leading-tight tracking-tight text-foreground">
            {story.headline}
          </h1>
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>
              {story.category} · {newsTimeAgo(story.createdAt)} · {formatCount(story.postCount)} posts
            </span>
            <span className="font-bold uppercase tracking-wider">· {story.state}</span>
          </p>
          {story.summary && (
            <p className="mt-2 text-[15px] leading-relaxed text-foreground">
              {cut ? `${short}…` : story.summary}{" "}
              {story.summary.length > short.length && (
                <button
                  onClick={() => setSummaryOpen((v) => !v)}
                  className="text-sm font-semibold text-brand"
                >
                  {summaryOpen ? "Show less" : "Show more"}
                </button>
              )}
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            This story is a summary of posts on WIZZ and may change as the conversation develops.
          </p>
        </div>

        <div className="mt-2">
          <TopLatestTabs tab={tab} onChange={setTab} />
        </div>

        {fresh > 0 && (
          <div className="flex justify-center py-2">
            <button
              onClick={() => {
                reset();
                void queryClient.invalidateQueries({ queryKey: ["story-posts", storyId] });
              }}
              className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-brand-foreground"
            >
              {fresh} new post{fresh === 1 ? "" : "s"}
            </button>
          </div>
        )}

        {posts.isLoading ? (
          <div className="space-y-3 px-4 py-4">
            {[0, 1].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-2/3 animate-pulse rounded bg-secondary" />
                <div className="h-3 w-full animate-pulse rounded bg-secondary" />
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            No posts in this story yet — be the first to post about it.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {visible.map((p) => (
              <StoryPostCard
                key={p.postId}
                post={p}
                onMuteAuthor={(id, name) => {
                  setMutedAuthors((prev) => [...prev, id]);
                  toast(`Muted @${name}`);
                }}
                onHide={() => toast("We'll show less like this.")}
              />
            ))}
          </div>
        )}
        <div ref={sentinel} className="grid h-12 place-items-center">
          {posts.isFetchingNextPage && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
        </div>

        {people.length > 0 && (
          <section className="border-t border-border" aria-label="Relevant people">
            <h2 className="px-4 pb-1 pt-4 text-sm font-extrabold text-foreground">
              Relevant people
            </h2>
            <div className="divide-y divide-border">
              {people.map((c) => (
                <RelevantPersonRow key={c.id} person={c} />
              ))}
            </div>
          </section>
        )}
        <div className="h-10" aria-hidden="true" />
      </div>

      <ShareSheet
        open={sharing}
        onClose={() => setSharing(false)}
        url={shareUrl}
        message={`${story.headline} on WIZZ`}
      />
      <ReportDialog
        open={reporting}
        onClose={() => setReporting(false)}
        target={{ kind: "story", refId: story.id, refTitle: story.headline }}
      />
    </AppShell>
  );
}

export function NewsThreadPending() {
  return (
    <AppShell title="Story">
      <div className="mx-auto w-full max-w-xl space-y-3 px-4 pt-4">
        <div className="h-8 w-3/4 animate-pulse rounded bg-secondary" />
        <div className="h-4 w-full animate-pulse rounded bg-secondary" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-secondary" />
      </div>
    </AppShell>
  );
}
