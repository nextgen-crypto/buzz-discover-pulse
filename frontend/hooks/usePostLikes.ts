import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePostingCapabilities } from "@/frontend/hooks/usePostingCapabilities";
import { writeErrorMessage } from "@/frontend/lib/writeError";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string | null): value is string {
  return value !== null && UUID_RE.test(value);
}

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

function isConflict(error: unknown): boolean {
  if (error && typeof error === "object" && "status" in error) {
    if ((error as { status?: unknown }).status === 409) return true;
  }
  return errorCode(error) === "23505";
}

/** Errors caused by the known pre-migration trigger/schema shape. */
function isUnsupportedRemoteError(error: unknown): boolean {
  const code = errorCode(error);
  const message = errorMessage(error);
  return (
    code === "42703" ||
    code === "PGRST202" ||
    code === "PGRST205" ||
    /record ["']new["'] has no field ["']parent_id["']|parent_id|schema cache|does not exist/i.test(
      message,
    )
  );
}

/** Real post likes, with a local fallback while the integrity migration is absent. */
export function usePostLikes(postId: string | null, userId: string | null) {
  const queryClient = useQueryClient();
  const canProbe = Boolean(userId && isUuid(postId));
  const capabilities = usePostingCapabilities(canProbe ? userId : null);
  const [remoteDisabledKey, setRemoteDisabledKey] = useState<string | null>(null);
  const [localState, setLocalState] = useState<{ key: string; liked: boolean }>({
    key: "",
    liked: false,
  });
  const localKey = `${userId ?? "anonymous"}:${postId ?? ""}`;
  const remoteDisabled = remoteDisabledKey === localKey;
  const likesReadable = canProbe && !remoteDisabled && capabilities.data?.likes === true;
  const integrityReady = canProbe && !remoteDisabled && capabilities.data?.integrity === true;
  const queryPostId = likesReadable ? postId : null;
  const remotePostId = integrityReady ? postId : null;
  const key = ["post-likes", postId, userId, queryPostId ? "remote" : "local"];

  const query = useQuery({
    queryKey: key,
    enabled: queryPostId !== null,
    staleTime: 15_000,
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<{ count: number; liked: boolean }> => {
      if (!queryPostId) return { count: 0, liked: false };
      const [{ count }, mine] = await Promise.all([
        supabase
          .from("post_likes")
          .select("user_id", { count: "exact", head: true })
          .eq("post_id", queryPostId),
        supabase
          .from("post_likes")
          .select("user_id")
          .eq("post_id", queryPostId)
          .eq("user_id", userId!)
          .maybeSingle(),
      ]);
      return { count: count ?? 0, liked: Boolean((mine as { data: unknown }).data) };
    },
  });

  useEffect(() => {
    if (query.error && isUnsupportedRemoteError(query.error)) {
      setRemoteDisabledKey(localKey);
    }
  }, [localKey, query.error]);

  const toggle = useMutation({
    mutationFn: async (like: boolean) => {
      if (!postId || !userId) throw new Error("Sign in to like posts.");
      if (!remotePostId) {
        setLocalState({ key: localKey, liked: like });
        return;
      }

      try {
        if (like) {
          const { error } = await supabase
            .from("post_likes")
            .insert({ user_id: userId, post_id: remotePostId });
          if (error && !isConflict(error)) throw error;
        } else {
          const { error } = await supabase
            .from("post_likes")
            .delete()
            .eq("user_id", userId)
            .eq("post_id", remotePostId);
          if (error) throw error;
        }
      } catch (error) {
        if (isUnsupportedRemoteError(error)) {
          setRemoteDisabledKey(localKey);
          setLocalState({ key: localKey, liked: like });
          return;
        }
        throw error;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["post-likes", postId, userId] });
    },
    onError: (error) => {
      toast.error(writeErrorMessage(error, "Could not like. Try again."));
    },
  });

  const hasLocalOverride = localState.key === localKey;
  const localLiked = hasLocalOverride ? localState.liked : false;
  const remoteLiked = queryPostId ? (query.data?.liked ?? false) : false;
  const remoteCount = queryPostId ? (query.data?.count ?? 0) : 0;
  return {
    count:
      remotePostId || !hasLocalOverride
        ? remoteCount
        : remoteCount + (localLiked && !remoteLiked ? 1 : 0),
    liked: remotePostId || !hasLocalOverride ? remoteLiked : localLiked,
    toggle: toggle.mutate,
    toggling: toggle.isPending,
    /** Consumers can use local state until the remote trigger is known-good. */
    remote: remotePostId !== null,
  };
}
