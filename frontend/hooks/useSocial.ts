import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { respondFollowRequest } from "@/backend/api/social.functions";
import { supabase } from "@/integrations/supabase/client";

export interface FollowRequest {
  requester_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
}

/** Private-account request inbox (owner side) + outgoing request state. */
export function useFollowRequests(userId: string | null) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["follow-requests", userId],
    enabled: Boolean(userId),
    staleTime: 15_000,
    queryFn: async (): Promise<FollowRequest[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("follow_requests")
        .select(
          "requester_id, created_at, profiles!follow_requests_requester_id_fkey(username, display_name, avatar_url)",
        )
        .eq("followee_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (
        (data ?? []) as {
          requester_id: string;
          created_at: string;
          profiles: { username: string; display_name: string; avatar_url: string | null } | null;
        }[]
      ).map((r) => ({
        requester_id: r.requester_id,
        username: r.profiles?.username ?? "?",
        display_name: r.profiles?.display_name ?? "?",
        avatar_url: r.profiles?.avatar_url ?? null,
        created_at: r.created_at,
      }));
    },
  });

  const respond = useMutation({
    mutationFn: async ({ requesterId, accept }: { requesterId: string; accept: boolean }) =>
      respondFollowRequest({ data: { requesterId, accept } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["follow-requests", userId] });
      void queryClient.invalidateQueries({ queryKey: ["my-stats", userId] });
    },
  });

  return {
    requests: query.data ?? [],
    respond: respond.mutate,
    responding: respond.isPending,
  };
}

/** Outgoing request state for one profile (viewer → private account). */
export function useOutgoingRequest(viewerId: string | null, profileId: string | null) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["follow-request-out", viewerId, profileId],
    enabled: Boolean(viewerId && profileId),
    staleTime: 15_000,
    queryFn: async (): Promise<boolean> => {
      if (!viewerId || !profileId) return false;
      const { data, error } = await supabase
        .from("follow_requests")
        .select("requester_id")
        .eq("requester_id", viewerId)
        .eq("followee_id", profileId)
        .maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },
  });

  const send = useMutation({
    mutationFn: async () => {
      if (!viewerId || !profileId) throw new Error("Sign in first.");
      const { error } = await supabase
        .from("follow_requests")
        .insert({ requester_id: viewerId, followee_id: profileId });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["follow-request-out", viewerId, profileId] });
    },
  });

  const withdraw = useMutation({
    mutationFn: async () => {
      if (!viewerId || !profileId) return;
      const { error } = await supabase
        .from("follow_requests")
        .delete()
        .eq("requester_id", viewerId)
        .eq("followee_id", profileId);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["follow-request-out", viewerId, profileId] });
    },
  });

  return { requested: query.data ?? false, send: send.mutate, withdraw: withdraw.mutate };
}

/** Block state both directions + actions. Backend-enforced everywhere. */
export function useBlockState(viewerId: string | null, profileId: string | null) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["block-state", viewerId, profileId],
    enabled: Boolean(viewerId && profileId && viewerId !== profileId),
    staleTime: 15_000,
    queryFn: async (): Promise<{ blockedByMe: boolean; blocksMe: boolean }> => {
      if (!viewerId || !profileId) return { blockedByMe: false, blocksMe: false };
      const { data, error } = await supabase
        .from("blocks")
        .select("blocker_id, blocked_id")
        .or(
          `and(blocker_id.eq.${viewerId},blocked_id.eq.${profileId}),and(blocker_id.eq.${profileId},blocked_id.eq.${viewerId})`,
        );
      if (error) throw error;
      const rows = (data ?? []) as { blocker_id: string; blocked_id: string }[];
      return {
        blockedByMe: rows.some((r) => r.blocker_id === viewerId),
        blocksMe: rows.some((r) => r.blocker_id === profileId),
      };
    },
  });

  const set = useMutation({
    mutationFn: async (block: boolean) => {
      if (!viewerId || !profileId) throw new Error("Sign in first.");
      if (block) {
        const { error } = await supabase
          .from("blocks")
          .insert({ blocker_id: viewerId, blocked_id: profileId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("blocks")
          .delete()
          .eq("blocker_id", viewerId)
          .eq("blocked_id", profileId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["block-state", viewerId, profileId] });
    },
  });

  return {
    blockedByMe: query.data?.blockedByMe ?? false,
    blocksMe: query.data?.blocksMe ?? false,
    setBlock: set.mutate,
  };
}

const MUTED_KEY = "wizz:muted-usernames";

function loadMuted(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(MUTED_KEY) ?? "[]") as unknown;
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Local mute for profile visits (feed mute stays id-based in useFeedPrefs). */
export function mutedUsernames(): string[] {
  return loadMuted();
}

export function toggleMutedUsername(username: string): boolean {
  const next = loadMuted().includes(username.toLowerCase())
    ? loadMuted().filter((x) => x !== username.toLowerCase())
    : [...loadMuted(), username.toLowerCase()];
  try {
    localStorage.setItem(MUTED_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next.includes(username.toLowerCase());
}
