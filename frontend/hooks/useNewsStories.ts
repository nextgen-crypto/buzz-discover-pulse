import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type StoryState =
  | "breaking"
  | "developing"
  | "updated"
  | "trending"
  | "live"
  | "archived";

export interface NewsStory {
  id: string;
  headline: string;
  summary: string;
  summaryShort: string;
  category: string;
  state: StoryState;
  coverImageUrl: string;
  createdAt: string;
  postCount: number;
  /** Hashtag-derived fallback when news_stories is absent. */
  synthetic: boolean;
}

function isMissingTable(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error ?? "");
  return /42P01|PGRST205|Could not find the table|does not exist/i.test(msg);
}

/** Hashtag-derived stories from live posts (pre-migration fallback). */
async function hashtagStories(): Promise<NewsStory[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("hashtags, created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw error;
  const counts = new Map<string, { count: number; latest: string }>();
  for (const row of (data ?? []) as { hashtags: string[]; created_at: string }[]) {
    for (const raw of row.hashtags ?? []) {
      const tag = raw.trim().toLowerCase();
      if (!tag) continue;
      const prev = counts.get(tag) ?? { count: 0, latest: row.created_at };
      counts.set(tag, { count: prev.count + 1, latest: row.created_at });
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1].count - a[1].count || b[1].latest.localeCompare(a[1].latest))
    .slice(0, 20)
    .map(([tag, v]) => ({
      id: `tag:${tag}`,
      headline: `#${tag}`,
      summary: "",
      summaryShort: "",
      category: "News",
      state: "developing" as StoryState,
      coverImageUrl: "",
      createdAt: v.latest,
      postCount: v.count,
      synthetic: true,
    }));
}

/** Today's stories, newest first. Falls back to hashtag topics pre-migration. */
export const newsStoriesQueryOptions = queryOptions({
  queryKey: ["news-stories"],
  staleTime: 60_000,
  retry: false,
  queryFn: async (): Promise<{ stories: NewsStory[]; live: boolean }> => {
    try {
      const { data: rows, error } = await supabase
        .from("news_stories")
        .select("id, headline, summary, summary_short, category, state, cover_image_url, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      const ids = ((rows ?? []) as { id: string }[]).map((r) => r.id);
      const counts = new Map<string, number>();
      if (ids.length > 0) {
        const { data: links } = await supabase
          .from("story_posts")
          .select("story_id")
          .in("story_id", ids)
          .limit(2000);
        for (const l of (links ?? []) as { story_id: string }[]) {
          counts.set(l.story_id, (counts.get(l.story_id) ?? 0) + 1);
        }
      }
      return {
        live: true,
        stories: ((rows ?? []) as Record<string, string>[]).map((r) => ({
          id: r.id,
          headline: r.headline,
          summary: r.summary ?? "",
          summaryShort: r.summary_short ?? "",
          category: r.category ?? "News",
          state: (r.state ?? "developing") as StoryState,
          coverImageUrl: r.cover_image_url ?? "",
          createdAt: r.created_at,
          postCount: counts.get(r.id) ?? 0,
          synthetic: false,
        })),
      };
    } catch (e) {
      if (!isMissingTable(e)) throw e;
      return { live: false, stories: await hashtagStories() };
    }
  },
});

export function useNewsStories() {
  return useQuery(newsStoriesQueryOptions);
}
