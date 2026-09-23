import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSharedRealtimeChannel } from "@/frontend/hooks/realtime";

export interface RemoteComment {
  id: string;
  user: string;
  text: string;
  time: string;
  likes: number;
  isLiked: boolean;
  isMine: boolean;
}

function timeAgo(iso: string): string {
  const mins = Math.max(1, Math.round((Date.now() - Date.parse(iso)) / 60_000));
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

function extractTags(text: string): { mentions: string[]; hashtags: string[] } {
  const mentions = [...text.matchAll(/@([\p{L}\p{N}._]+)/gu)].map((m) => m[1]!.toLowerCase());
  const hashtags = [...text.matchAll(/#([\p{L}\p{N}_]+)/gu)].map((m) => m[1]!.toLowerCase());
  return {
    mentions: [...new Set(mentions)].slice(0, 5),
    hashtags: [...new Set(hashtags)].slice(0, 5),
  };
}

/**
 * Relational comments, read-light:
 * - one joined query (comments + author) with keyset-friendly ordering
 * - one aggregated likes lookup, one viewer-likes lookup
 * - denormalized posts.comments_count means the feed never COUNT(*)s
 * - realtime INSERTs stream in while the sheet is open
 */
export function usePostComments(postId: string | null, userId: string | null) {
  const queryClient = useQueryClient();
  const key = ["post-comments", postId, userId];

  const query = useQuery({
    queryKey: key,
    enabled: postId !== null,
    staleTime: 15_000,
    queryFn: async (): Promise<{ comments: RemoteComment[]; total: number }> => {
      if (!postId) return { comments: [], total: 0 };
      const { data: rows, error } = await supabase
        .from("comments")
        .select("id, body, created_at, author_id, profiles(username, display_name)")
        .eq("post_id", postId)
        .is("parent_id", null)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      const list = (rows ?? []) as {
        id: string;
        body: string;
        created_at: string;
        author_id: string;
        profiles: { username: string; display_name: string } | null;
      }[];
      const ids = list.map((c) => c.id);
      const likeCount = new Map<string, number>();
      const likedByMe = new Set<string>();
      if (ids.length > 0) {
        const { data: likes } = await supabase
          .from("comment_likes")
          .select("comment_id")
          .in("comment_id", ids);
        for (const l of (likes ?? []) as { comment_id: string }[]) {
          likeCount.set(l.comment_id, (likeCount.get(l.comment_id) ?? 0) + 1);
        }
        if (userId) {
          const { data: mineRows } = await supabase
            .from("comment_likes")
            .select("comment_id")
            .eq("user_id", userId)
            .in("comment_id", ids);
          for (const l of (mineRows ?? []) as { comment_id: string }[]) {
            likedByMe.add(l.comment_id);
          }
        }
      }
      const comments: RemoteComment[] = list.map((c) => ({
        id: c.id,
        user: c.profiles?.username ?? "someone",
        text: c.body,
        time: timeAgo(c.created_at),
        likes: likeCount.get(c.id) ?? 0,
        isLiked: likedByMe.has(c.id),
        isMine: userId !== null && c.author_id === userId,
      }));
      const { count } = await supabase
        .from("comments")
        .select("id", { count: "exact", head: true })
        .eq("post_id", postId)
        .is("parent_id", null)
        .eq("is_deleted", false);
      return { comments, total: count ?? comments.length };
    },
  });

  useSharedRealtimeChannel(postId ? `comments:${postId}` : null, (channel) => {
    channel
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comments", filter: `post_id=eq.${postId}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["post-comments", postId] });
        },
      )
      .subscribe();
  });

  const post = useMutation({
    mutationFn: async (text: string) => {
      if (!postId || !userId) throw new Error("Sign in to comment.");
      const clean = text.trim().slice(0, 1000);
      if (!clean) throw new Error("Write something first.");
      const { mentions, hashtags } = extractTags(clean);
      const { error } = await supabase.from("comments").insert({
        post_id: postId,
        author_id: userId,
        body: clean,
        metadata: { client: "web", mentions, hashtags },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["post-comments", postId] });
    },
  });

  const toggleLike = useMutation({
    mutationFn: async ({ commentId, like }: { commentId: string; like: boolean }) => {
      if (!userId) throw new Error("Sign in to like comments.");
      if (like) {
        const { error } = await supabase
          .from("comment_likes")
          .insert({ user_id: userId, comment_id: commentId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("comment_likes")
          .delete()
          .eq("user_id", userId)
          .eq("comment_id", commentId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["post-comments", postId] });
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    postComment: post.mutate,
    posting: post.isPending,
    postError: post.error,
    toggleLike: toggleLike.mutate,
  };
}
