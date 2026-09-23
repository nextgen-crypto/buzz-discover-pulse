import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TrendingTopic {
  id: string;
  label: string;
  context: string;
  postCount: number;
}

/** Ranked topics. Falls back to live hashtag counts pre-migration. */
export const trendingTopicsQueryOptions = queryOptions({
  queryKey: ["trending-topics"],
  staleTime: 60_000,
  retry: false,
  queryFn: async (): Promise<TrendingTopic[]> => {
    try {
      const { data, error } = await supabase
        .from("trending_topics")
        .select("id, label, context, post_count")
        .order("rank", { ascending: true })
        .limit(10);
      if (error) throw error;
      return ((data ?? []) as Record<string, string | number>[]).map((t) => ({
        id: String(t.id),
        label: String(t.label),
        context: String(t.context ?? ""),
        postCount: Number(t.post_count ?? 0),
      }));
    } catch {
      const { data, error: postError } = await supabase
        .from("posts")
        .select("hashtags")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(300);
      if (postError) return [];
      const counts = new Map<string, number>();
      for (const row of (data ?? []) as { hashtags: string[] }[]) {
        for (const raw of row.hashtags ?? []) {
          const tag = raw.trim().toLowerCase();
          if (tag) counts.set(tag, (counts.get(tag) ?? 0) + 1);
        }
      }
      return [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([tag, n]) => ({
          id: `tag:${tag}`,
          label: `#${tag}`,
          context: "Trending",
          postCount: n,
        }));
    }
  },
});

export function useTrendingTopics() {
  return useQuery(trendingTopicsQueryOptions);
}
