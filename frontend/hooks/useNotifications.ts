import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSharedRealtimeChannel } from "@/frontend/hooks/realtime";

export interface AppNotification {
  id: string;
  kind: string;
  actor_id: string;
  actor_name: string;
  actor_username: string;
  ref_id: string;
  text: string;
  is_read: boolean;
  created_at: string;
}

function timeAgo(iso: string): string {
  const mins = Math.max(1, Math.round((Date.now() - Date.parse(iso)) / 60_000));
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

/** Real inbox: own notifications + actor names, live INSERT stream. */
export function useNotifications(userId: string | null) {
  const queryClient = useQueryClient();
  const key = useMemo(() => ["notifications", userId] as const, [userId]);

  const query = useQuery({
    queryKey: key,
    enabled: Boolean(userId),
    staleTime: 15_000,
    queryFn: async (): Promise<AppNotification[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("notifications")
        .select(
          "id, kind, actor_id, ref_id, text, is_read, created_at, profiles!notifications_actor_id_fkey(username, display_name)",
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (
        (data ?? []) as {
          id: string;
          kind: string;
          actor_id: string;
          ref_id: string;
          text: string;
          is_read: boolean;
          created_at: string;
          profiles: { username: string; display_name: string } | null;
        }[]
      ).map((n) => ({
        id: n.id,
        kind: n.kind,
        actor_id: n.actor_id,
        actor_name: n.profiles?.display_name ?? "Someone",
        actor_username: n.profiles?.username ?? "?",
        ref_id: n.ref_id,
        text: n.text,
        is_read: n.is_read,
        created_at: n.created_at,
      }));
    },
  });

  useSharedRealtimeChannel(userId ? `notif:${userId}` : null, (channel) => {
    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: key });
        },
      )
      .subscribe();
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: key });
    },
  });

  const markOneRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: key });
    },
  });

  const items = query.data ?? [];
  return {
    items,
    unread: items.filter((n) => !n.is_read).length,
    isLoading: query.isLoading,
    timeAgo,
    markAllRead: markAllRead.mutate,
    markOneRead: markOneRead.mutate,
  };
}
