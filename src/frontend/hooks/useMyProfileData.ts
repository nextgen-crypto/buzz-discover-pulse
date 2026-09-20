import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ProfilePost = {
  id: string;
  caption: string;
  image_url: string | null;
  created_at: string;
};

export type ProfileStats = {
  posts: number;
  followers: number;
  following: number;
};

/** Real posts authored by the signed-in user. */
export function useMyPosts(userId: string | null) {
  return useQuery({
    queryKey: ["my-posts", userId],
    enabled: Boolean(userId),
    staleTime: 30_000,
    queryFn: async (): Promise<ProfilePost[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("posts")
        .select("id, caption, image_url, created_at")
        .eq("author_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ProfilePost[];
    },
  });
}

/** Real post / follower / following counts for the signed-in user. */
export function useMyStats(userId: string | null) {
  return useQuery({
    queryKey: ["my-stats", userId],
    enabled: Boolean(userId),
    staleTime: 30_000,
    queryFn: async (): Promise<ProfileStats> => {
      if (!userId) return { posts: 0, followers: 0, following: 0 };
      const [posts, followers, following] = await Promise.all([
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("author_id", userId),
        supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("followee_id", userId),
        supabase.from("follows").select("followee_id", { count: "exact", head: true }).eq("follower_id", userId),
      ]);
      return {
        posts: posts.count ?? 0,
        followers: followers.count ?? 0,
        following: following.count ?? 0,
      };
    },
  });
}
