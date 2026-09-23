import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Real post likes (uuid posts). Seed items keep local-only state. */
export function usePostLikes(postId: string | null, userId: string | null) {
  const queryClient = useQueryClient();
  const key = ["post-likes", postId, userId];

  const query = useQuery({
    queryKey: key,
    enabled: postId !== null,
    staleTime: 15_000,
    queryFn: async (): Promise<{ count: number; liked: boolean }> => {
      if (!postId) return { count: 0, liked: false };
      const [{ count }, mine] = await Promise.all([
        supabase
          .from("post_likes")
          .select("user_id", { count: "exact", head: true })
          .eq("post_id", postId),
        userId
          ? supabase
              .from("post_likes")
              .select("user_id")
              .eq("post_id", postId)
              .eq("user_id", userId)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      return { count: count ?? 0, liked: Boolean((mine as { data: unknown }).data) };
    },
  });

  const toggle = useMutation({
    mutationFn: async (like: boolean) => {
      if (!postId || !userId) throw new Error("Sign in to like posts.");
      if (like) {
        const { error } = await supabase
          .from("post_likes")
          .insert({ user_id: userId, post_id: postId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("user_id", userId)
          .eq("post_id", postId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: key });
    },
  });

  return {
    count: query.data?.count ?? 0,
    liked: query.data?.liked ?? false,
    toggle: toggle.mutate,
    toggling: toggle.isPending,
  };
}
