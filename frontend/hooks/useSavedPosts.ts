import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SavedPost = {
  id: string;
  caption: string;
  image_url: string | null;
  created_at: string;
  category: string;
  hashtags: string[];
};

/** Posts the signed-in user has saved. */
export function useSavedPosts(userId: string | null) {
  return useQuery({
    queryKey: ["saved-posts", userId],
    enabled: Boolean(userId),
    staleTime: 30_000,
    queryFn: async (): Promise<SavedPost[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("saves")
        .select(
          "post_id, created_at, posts(id, caption, image_url, created_at, category, hashtags)",
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? [])
        .map((row) => (row as { posts: SavedPost | null }).posts)
        .filter((p): p is SavedPost => Boolean(p));
    },
  });
}

/** Save or unsave a post for the signed-in user. */
export function useToggleSave(userId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, save }: { postId: string; save: boolean }) => {
      if (!userId) throw new Error("Sign in to save posts.");
      if (save) {
        const { error } = await supabase.from("saves").insert({ user_id: userId, post_id: postId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("saves")
          .delete()
          .eq("user_id", userId)
          .eq("post_id", postId);
        if (error) throw error;
      }
      return save;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["saved-posts", userId] });
    },
  });
}
