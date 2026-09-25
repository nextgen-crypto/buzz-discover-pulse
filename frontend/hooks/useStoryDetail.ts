import { useEffect, useState } from "react";
import {
  queryOptions,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSharedRealtimeChannel } from "@/frontend/hooks/realtime";
import { writeErrorMessage } from "@/frontend/lib/writeError";
import { useSession } from "@/frontend/hooks/useSession";
import { hydratePostMediaList } from "@/frontend/lib/postMedia";
import type { NewsStory } from "@/frontend/hooks/useNewsStories";

export type StoryTab = "Top" | "Latest";

export interface StoryAuthor {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  verified: boolean;
  isPrivate: boolean;
}

export interface StoryPost {
  postId: string;
  caption: string;
  imageUrl: string | null;
  videoUrl: string | null;
  createdAt: string;
  commentsCount: number;
  views: number;
  author: StoryAuthor | null;
}

export interface RelevantPerson extends StoryAuthor {
  bio: string;
}

const PAGE_SIZE = 8;

function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

interface PostRow {
  id: string;
  caption: string;
  image_url: string | null;
  image_path?: string;
  video_url?: string | null;
  video_path?: string;
  hashtags: string[];
  created_at: string;
  comments_count: number;
  author_id: string;
}

async function hydrate(rows: PostRow[]): Promise<StoryPost[]> {
  const authorIds = [...new Set(rows.map((r) => r.author_id))];
  const byId = new Map<string, StoryAuthor>();
  const [profilesRes, views] = await Promise.all([
    authorIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url, verified, is_private")
          .in("id", authorIds)
      : Promise.resolve({ data: [] as unknown[] }),
    fetchViews(rows.map((r) => r.id)),
  ]);
  const data = (profilesRes as { data: unknown[] | null }).data;
  for (const p of (data ?? []) as Record<string, string | boolean>[]) {
    byId.set(String(p.id), {
      id: String(p.id),
      username: String(p.username ?? "?"),
      displayName: String(p.display_name ?? "?"),
      avatarUrl: (p.avatar_url as string | null) ?? null,
      verified: p.verified === true,
      isPrivate: p.is_private === true,
    });
  }
  const hydratedRows = await hydratePostMediaList(rows);
  return hydratedRows.map((r) => ({
    postId: r.id,
    caption: r.caption ?? "",
    imageUrl: r.image_url,
    videoUrl: r.video_url ?? null,
    createdAt: r.created_at,
    commentsCount: r.comments_count ?? 0,
    views: views.get(r.id) ?? 0,
    author: byId.get(r.author_id) ?? null,
  }));
}

async function fetchViews(ids: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (ids.length === 0) return map;
  const { data } = await supabase
    .from("post_stats")
    .select("post_id, impressions")
    .in("post_id", ids);
  for (const row of (data ?? []) as { post_id: string; impressions: number }[]) {
    map.set(row.post_id, row.impressions ?? 0);
  }
  return map;
}

async function fetchRealPage(
  storyId: string,
  tab: StoryTab,
  cursor: { score: number; added: string; id: string } | null,
): Promise<{ items: StoryPost[]; next: { score: number; added: string; id: string } | null }> {
  let query = supabase
    .from("story_posts")
    .select("post_id, relevance_score, added_at")
    .eq("story_id", storyId);
  if (tab === "Top") {
    query = query.order("relevance_score", { ascending: false }).order("post_id");
    if (cursor) {
      query = query.or(
        `relevance_score.lt.${cursor.score},and(relevance_score.eq.${cursor.score},post_id.gt.${cursor.id})`,
      );
    }
  } else {
    query = query.order("added_at", { ascending: false }).order("post_id");
    if (cursor) {
      query = query.or(
        `added_at.lt.${cursor.added},and(added_at.eq.${cursor.added},post_id.gt.${cursor.id})`,
      );
    }
  }
  const { data: links, error } = await query.limit(PAGE_SIZE + 1);
  if (error) throw error;
  const page = (links ?? []) as { post_id: string; relevance_score: number; added_at: string }[];
  const hasMore = page.length > PAGE_SIZE;
  const slice = hasMore ? page.slice(0, PAGE_SIZE) : page;
  if (slice.length === 0) return { items: [], next: null };
  const postIds = slice.map((link) => link.post_id);
  const current = await supabase
    .from("posts")
    .select(
      "id, caption, image_url, image_path, video_url, video_path, hashtags, created_at, comments_count, author_id",
    )
    .in("id", postIds)
    .eq("status", "published");
  const compatible = current.error
    ? await supabase
        .from("posts")
        .select(
          "id, caption, image_url, video_url, hashtags, created_at, comments_count, author_id",
        )
        .in("id", postIds)
        .eq("status", "published")
    : current;
  if (compatible.error) throw compatible.error;
  const posts = compatible.data;
  const byId = new Map(((posts ?? []) as PostRow[]).map((p) => [p.id, p]));
  const ordered = slice.map((l) => byId.get(l.post_id)).filter((p): p is PostRow => Boolean(p));
  const items = await hydrate(ordered);
  const last = slice[slice.length - 1]!;
  return {
    items,
    next: hasMore ? { score: last.relevance_score, added: last.added_at, id: last.post_id } : null,
  };
}

async function fetchTagPage(
  tag: string,
  tab: StoryTab,
  cursor: string | null,
): Promise<{ items: StoryPost[]; next: string | null }> {
  const runQuery = (select: string) => {
    let query = supabase
      .from("posts")
      .select(select)
      .eq("status", "published")
      .contains("hashtags", [tag]);
    if (tab === "Top") {
      query = query.order("comments_count", { ascending: false }).order("id");
    } else {
      query = query.order("created_at", { ascending: false });
      if (cursor) query = query.lt("created_at", cursor);
    }
    return query.limit(PAGE_SIZE + 1);
  };
  const current = await runQuery(
    "id, caption, image_url, image_path, video_url, video_path, hashtags, created_at, comments_count, author_id",
  );
  const compatible = current.error
    ? await runQuery(
        "id, caption, image_url, video_url, hashtags, created_at, comments_count, author_id",
      )
    : current;
  if (compatible.error) throw compatible.error;
  const data = compatible.data;
  const rows = (data ?? []) as unknown as PostRow[];
  const hasMore = rows.length > PAGE_SIZE;
  const slice = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  return {
    items: await hydrate(slice),
    next: hasMore ? slice[slice.length - 1]!.created_at : null,
  };
}

/** Story header row (real table, or synthetic from a hashtag fallback id). */
export const storyQueryOptions = (storyId: string) =>
  queryOptions({
    queryKey: ["news-story", storyId],
    staleTime: 60_000,
    retry: false,
    queryFn: async (): Promise<NewsStory | null> => {
      if (storyId.startsWith("tag:")) {
        const tag = storyId.slice(4);
        const { count } = await supabase
          .from("posts")
          .select("id", { count: "exact", head: true })
          .eq("status", "published")
          .contains("hashtags", [tag]);
        return {
          id: storyId,
          headline: `#${tag}`,
          summary: "",
          summaryShort: "",
          category: "News",
          state: "developing",
          coverImageUrl: "",
          createdAt: new Date().toISOString(),
          postCount: count ?? 0,
          synthetic: true,
        };
      }
      const { data, error } = await supabase
        .from("news_stories")
        .select(
          "id, headline, summary, summary_short, category, state, cover_image_url, created_at",
        )
        .eq("id", storyId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const r = data as Record<string, string>;
      const { count } = await supabase
        .from("story_posts")
        .select("post_id", { count: "exact", head: true })
        .eq("story_id", storyId);
      return {
        id: r.id,
        headline: r.headline,
        summary: r.summary ?? "",
        summaryShort: r.summary_short ?? "",
        category: r.category ?? "News",
        state: (r.state ?? "developing") as NewsStory["state"],
        coverImageUrl: r.cover_image_url ?? "",
        createdAt: r.created_at,
        postCount: count ?? 0,
        synthetic: false,
      };
    },
  });

export function useStory(storyId: string) {
  return useQuery(storyQueryOptions(storyId));
}

/** Keyset-paginated story posts. Never auto-inserts — see useStoryLiveCount. */
export function useStoryPosts(storyId: string, tab: StoryTab) {
  const { user } = useSession();
  return useInfiniteQuery({
    queryKey: ["story-posts", user?.id ?? "anonymous", storyId, tab],
    initialPageParam: null as { score: number; added: string; id: string } | string | null,
    staleTime: 30_000,
    retry: false,
    queryFn: async ({ pageParam }) => {
      if (storyId.startsWith("tag:")) {
        return fetchTagPage(storyId.slice(4), tab, pageParam as string | null);
      }
      return fetchRealPage(
        storyId,
        tab,
        pageParam as { score: number; added: string; id: string } | null,
      );
    },
    getNextPageParam: (last) => last.next,
  });
}

/** Counts rows that arrived while reading; the pill (not auto-insert) consumes it. */
export function useStoryLiveCount(storyId: string, enabled: boolean) {
  const [fresh, setFresh] = useState(0);
  useSharedRealtimeChannel(
    enabled && isUuid(storyId) ? `story-posts:${storyId}` : null,
    (channel) => {
      channel
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "story_posts",
            filter: `story_id=eq.${storyId}`,
          },
          () => setFresh((n) => n + 1),
        )
        .subscribe();
    },
  );
  return { fresh, reset: () => setFresh(0) };
}

/** Curated relevant people; synthetic stories use the tag's top authors. */
export function useRelevantPeople(storyId: string) {
  const { user } = useSession();
  return useQuery({
    queryKey: ["story-people", user?.id ?? "anonymous", storyId],
    staleTime: 60_000,
    retry: false,
    queryFn: async (): Promise<RelevantPerson[]> => {
      if (storyId.startsWith("tag:")) {
        const tag = storyId.slice(4);
        const { data, error } = await supabase
          .from("posts")
          .select("author_id")
          .eq("status", "published")
          .contains("hashtags", [tag])
          .order("created_at", { ascending: false })
          .limit(100);
        if (error) throw error;
        const counts = new Map<string, number>();
        for (const r of (data ?? []) as { author_id: string }[]) {
          counts.set(r.author_id, (counts.get(r.author_id) ?? 0) + 1);
        }
        const top = [...counts.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([id]) => id);
        if (top.length === 0) return [];
        const { data: profiles, error: pError } = await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url, verified, is_private, bio")
          .in("id", top);
        if (pError) throw pError;
        return ((profiles ?? []) as Record<string, string | boolean>[]).map((p) => ({
          id: String(p.id),
          username: String(p.username ?? "?"),
          displayName: String(p.display_name ?? "?"),
          avatarUrl: (p.avatar_url as string | null) ?? null,
          verified: p.verified === true,
          isPrivate: p.is_private === true,
          bio: String(p.bio ?? ""),
        }));
      }
      const { data: links, error } = await supabase
        .from("story_relevant_people")
        .select("profile_id")
        .eq("story_id", storyId)
        .order("rank", { ascending: true })
        .limit(10);
      if (error) throw error;
      const ids = ((links ?? []) as { profile_id: string }[]).map((l) => l.profile_id);
      if (ids.length === 0) return [];
      const { data: profiles, error: pError } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, verified, is_private, bio")
        .in("id", ids);
      if (pError) throw pError;
      const byId = new Map(
        ((profiles ?? []) as Record<string, string | boolean>[]).map((p) => [String(p.id), p]),
      );
      return ids.flatMap((id) => {
        const p = byId.get(id);
        return p
          ? [
              {
                id,
                username: String(p.username ?? "?"),
                displayName: String(p.display_name ?? "?"),
                avatarUrl: (p.avatar_url as string | null) ?? null,
                verified: p.verified === true,
                isPrivate: p.is_private === true,
                bio: String(p.bio ?? ""),
              },
            ]
          : [];
      });
    },
  });
}

function localList(key: string): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(key) ?? "[]") as unknown;
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Story follow/save state. Synthetic (tag) stories persist locally. */
export function useStoryFlags(storyId: string, userId: string | null) {
  const queryClient = useQueryClient();
  const real = isUuid(storyId);
  const [localFollowed, setLocalFollowed] = useState(() =>
    localList("wizz:news-stories-followed").includes(storyId),
  );
  const [localSaved, setLocalSaved] = useState(() =>
    localList("wizz:news-saved").includes(storyId),
  );

  useEffect(() => {
    setLocalFollowed(localList("wizz:news-stories-followed").includes(storyId));
    setLocalSaved(localList("wizz:news-saved").includes(storyId));
  }, [storyId]);

  const followedQuery = useQuery({
    queryKey: ["story-followed", storyId, userId],
    enabled: real && Boolean(userId),
    staleTime: 15_000,
    retry: false,
    queryFn: async () => {
      if (!userId) return false;
      const { data, error } = await supabase
        .from("story_follows")
        .select("story_id")
        .eq("story_id", storyId)
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },
  });

  const savedQuery = useQuery({
    queryKey: ["story-saved", storyId, userId],
    enabled: real && Boolean(userId),
    staleTime: 15_000,
    retry: false,
    queryFn: async () => {
      if (!userId) return false;
      const { data, error } = await supabase
        .from("story_saves")
        .select("story_id")
        .eq("story_id", storyId)
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },
  });

  function toggleLocal(key: string, id: string, set: (v: boolean) => void) {
    const next = localList(key).includes(id)
      ? localList(key).filter((x) => x !== id)
      : [...localList(key), id];
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // ignore
    }
    set(next.includes(id));
  }

  const mutate = useMutation({
    mutationFn: async ({ kind, on }: { kind: "follow" | "save"; on: boolean }) => {
      if (!userId) throw new Error("Sign in first.");
      if (!real) {
        toggleLocal(
          kind === "follow" ? "wizz:news-stories-followed" : "wizz:news-saved",
          storyId,
          kind === "follow" ? setLocalFollowed : setLocalSaved,
        );
        return on;
      }
      const table = kind === "follow" ? "story_follows" : "story_saves";
      if (on) {
        const { error } = await supabase.from(table).insert({ story_id: storyId, user_id: userId });
        if (error && !error.message.includes("duplicate")) throw error;
      } else {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq("story_id", storyId)
          .eq("user_id", userId);
        if (error) throw error;
      }
      return on;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["story-followed", storyId, userId] });
      void queryClient.invalidateQueries({ queryKey: ["story-saved", storyId, userId] });
      void queryClient.invalidateQueries({ queryKey: ["my-story-saves", userId] });
    },
    onError: (e) => {
      toast.error(writeErrorMessage(e, "Try again."));
    },
  });

  return {
    followed: real ? (followedQuery.data ?? false) : localFollowed,
    saved: real ? (savedQuery.data ?? false) : localSaved,
    setFollowed: (on: boolean) => mutate.mutate({ kind: "follow", on }),
    setSaved: (on: boolean) => mutate.mutate({ kind: "save", on }),
  };
}

/** Saved stories for Profile → Saved → News. */
export function useMyStorySaves(userId: string | null) {
  return useQuery({
    queryKey: ["my-story-saves", userId],
    enabled: Boolean(userId),
    staleTime: 30_000,
    retry: false,
    queryFn: async () => {
      if (!userId) return [];
      try {
        const { data: rows, error } = await supabase
          .from("story_saves")
          .select("story_id, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(50);
        if (error) throw error;
        const ids = ((rows ?? []) as { story_id: string }[]).map((r) => r.story_id);
        if (ids.length === 0) return [];
        const { data: stories, error: sError } = await supabase
          .from("news_stories")
          .select("id, headline, category, created_at")
          .in("id", ids);
        if (sError) throw sError;
        return (stories ?? []) as {
          id: string;
          headline: string;
          category: string;
          created_at: string;
        }[];
      } catch {
        return [];
      }
    },
  });
}
