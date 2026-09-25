import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePostingCapabilities } from "@/frontend/hooks/usePostingCapabilities";
import { writeErrorMessage } from "@/frontend/lib/writeError";
import { hydratePostMediaList } from "@/frontend/lib/postMedia";

export type SavedPost = {
  id: string;
  caption: string;
  image_url: string | null;
  image_path: string;
  created_at: string;
  category: string;
  hashtags: string[];
};

const SAVED_POSTS_SELECT =
  "post_id, created_at, posts(id, caption, image_url, created_at, category, hashtags)";
const SAVED_POSTS_MEDIA_SELECT =
  "post_id, created_at, posts(id, caption, image_url, image_path, created_at, category, hashtags)";

function errorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message ?? "");
  }
  return error instanceof Error ? error.message : String(error ?? "");
}

function errorCode(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    return String((error as { code?: unknown }).code ?? "");
  }
  return "";
}

function isMediaSchemaError(error: unknown): boolean {
  return (
    errorCode(error) === "42703" ||
    errorCode(error) === "PGRST202" ||
    /image_path|video_path|schema cache|column .* does not exist/i.test(errorMessage(error))
  );
}

function isConflict(error: unknown): boolean {
  if (error && typeof error === "object" && "status" in error) {
    if ((error as { status?: unknown }).status === 409) return true;
  }
  return errorCode(error) === "23505";
}

async function fetchSavedPosts(userId: string, select: string): Promise<SavedPost[]> {
  const result = await supabase
    .from("saves")
    .select(select)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (result.error) throw result.error;

  const posts = (result.data ?? [])
    .map(
      (row) =>
        (
          row as {
            posts: (Omit<SavedPost, "image_path"> & { image_path?: string | null }) | null;
          }
        ).posts,
    )
    .filter((post): post is Omit<SavedPost, "image_path"> & { image_path?: string | null } =>
      Boolean(post),
    )
    .map((post) => ({ ...post, image_path: post.image_path ?? "" }));
  return hydratePostMediaList(posts);
}

/** Posts the signed-in user has saved, with a legacy-schema-safe media query. */
export function useSavedPosts(userId: string | null) {
  const capabilities = usePostingCapabilities(userId);
  const savesAvailable = capabilities.data?.saves === true;
  const supportsMediaPaths = capabilities.data?.media === true;

  return useQuery({
    queryKey: [
      "saved-posts",
      userId,
      savesAvailable ? (supportsMediaPaths ? "media" : "legacy") : "unavailable",
    ],
    enabled: Boolean(userId) && savesAvailable,
    staleTime: 30_000,
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<SavedPost[]> => {
      if (!userId || !savesAvailable) return [];
      if (!supportsMediaPaths) return fetchSavedPosts(userId, SAVED_POSTS_SELECT);
      try {
        return await fetchSavedPosts(userId, SAVED_POSTS_MEDIA_SELECT);
      } catch (error) {
        // A migration can be partially applied while a client is connected.
        if (!isMediaSchemaError(error)) throw error;
        return fetchSavedPosts(userId, SAVED_POSTS_SELECT);
      }
    },
  });
}

/** Save or unsave a post for the signed-in user. */
export function useToggleSave(userId: string | null) {
  const queryClient = useQueryClient();
  const capabilities = usePostingCapabilities(userId);
  const remote = capabilities.data?.saves === true;
  const mutation = useMutation({
    mutationFn: async ({ postId, save }: { postId: string; save: boolean }) => {
      if (!userId) throw new Error("Sign in to save posts.");
      if (!remote) throw new Error("Saving is not available yet.");
      if (save) {
        const { error } = await supabase.from("saves").insert({ user_id: userId, post_id: postId });
        // A double click or a stale card can race an already-satisfied insert.
        if (error && !isConflict(error)) throw error;
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
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["saved-posts", userId] });
    },
    onError: (error) => {
      toast.error(writeErrorMessage(error, "Could not save. Try again."));
    },
  });
  return Object.assign(mutation, { remote });
}
