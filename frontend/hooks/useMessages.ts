import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSharedRealtimeChannel } from "@/frontend/hooks/realtime";

export interface Peer {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

export interface Conversation {
  id: string;
  peer: Peer;
  lastMessage: string;
  lastAt: string;
  unread: number;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  body: string;
  is_read: boolean;
  created_at: string;
  mine: boolean;
}

function orderPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

/** Open (or find) the 1:1 conversation between two users. */
export async function getOrCreateConversation(me: string, peer: string): Promise<string> {
  const [userA, userB] = orderPair(me, peer);
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_a_id", userA)
    .eq("user_b_id", userB)
    .maybeSingle();
  if (existing) return (existing as { id: string }).id;
  const { data, error } = await supabase
    .from("conversations")
    .insert({ user_a_id: userA, user_b_id: userB })
    .select("id")
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export function useConversations(userId: string | null) {
  const query = useQuery({
    queryKey: ["conversations", userId],
    enabled: Boolean(userId),
    staleTime: 10_000,
    queryFn: async (): Promise<Conversation[]> => {
      if (!userId) return [];
      const { data: convos, error } = await supabase
        .from("conversations")
        .select("id, user_a_id, user_b_id, last_message_at")
        .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
        .order("last_message_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      const list = (convos ?? []) as {
        id: string;
        user_a_id: string;
        user_b_id: string;
        last_message_at: string;
      }[];
      if (list.length === 0) return [];
      const peerIds = [
        ...new Set(list.map((c) => (c.user_a_id === userId ? c.user_b_id : c.user_a_id))),
      ];
      const convIds = list.map((c) => c.id);
      const [{ data: peers }, { data: lastMsgs }, { data: unreadRows }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url")
          .in("id", peerIds),
        supabase
          .from("messages")
          .select("conversation_id, body, created_at")
          .in("conversation_id", convIds)
          .order("created_at", { ascending: false })
          .limit(convIds.length * 5),
        supabase
          .from("messages")
          .select("conversation_id")
          .in("conversation_id", convIds)
          .neq("sender_id", userId)
          .eq("is_read", false)
          .limit(500),
      ]);
      const peerMap = new Map(((peers ?? []) as Peer[]).map((p) => [p.id, p]));
      const lastMap = new Map<string, { body: string; at: string }>();
      for (const m of (lastMsgs ?? []) as {
        conversation_id: string;
        body: string;
        created_at: string;
      }[]) {
        if (!lastMap.has(m.conversation_id))
          lastMap.set(m.conversation_id, { body: m.body, at: m.created_at });
      }
      const unreadMap = new Map<string, number>();
      for (const m of (unreadRows ?? []) as { conversation_id: string }[]) {
        unreadMap.set(m.conversation_id, (unreadMap.get(m.conversation_id) ?? 0) + 1);
      }
      return list.map((c) => {
        const peerId = c.user_a_id === userId ? c.user_b_id : c.user_a_id;
        const peer = peerMap.get(peerId) ?? {
          id: peerId,
          username: "?",
          display_name: "?",
          avatar_url: null,
        };
        const last = lastMap.get(c.id);
        return {
          id: c.id,
          peer,
          lastMessage: last?.body ?? "Say hi to start chatting",
          lastAt: last?.at ?? c.last_message_at,
          unread: unreadMap.get(c.id) ?? 0,
        };
      });
    },
  });

  useSharedRealtimeChannel(userId ? `convos:${userId}` : null, (channel) => {
    channel
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () =>
        query.refetch(),
      )
      .subscribe();
  });

  return query;
}

export function useMessages(conversationId: string | null, userId: string | null) {
  const queryClient = useQueryClient();
  const key = useMemo(() => ["messages", conversationId] as const, [conversationId]);

  const query = useQuery({
    queryKey: key,
    enabled: Boolean(conversationId && userId),
    staleTime: 5_000,
    queryFn: async (): Promise<ChatMessage[]> => {
      if (!conversationId || !userId) return [];
      const { data, error } = await supabase
        .from("messages")
        .select("id, sender_id, body, is_read, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(100);
      if (error) throw error;
      return ((data ?? []) as Omit<ChatMessage, "mine">[]).map((m) => ({
        ...m,
        mine: m.sender_id === userId,
      }));
    },
  });

  useSharedRealtimeChannel(conversationId ? `chat:${conversationId}` : null, (channel) => {
    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: key });
          void queryClient.invalidateQueries({ queryKey: ["conversations"] });
        },
      )
      .subscribe();
  });

  const send = useMutation({
    mutationFn: async (body: string) => {
      const text = body.trim().slice(0, 1000);
      if (!text) throw new Error("Empty message.");
      if (!conversationId || !userId) throw new Error("Sign in to chat.");
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: userId,
        body: text,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: key });
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const markRead = useMutation({
    mutationFn: async () => {
      if (!conversationId || !userId) return;
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", userId)
        .eq("is_read", false);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  return {
    messages: query.data ?? [],
    isLoading: query.isLoading,
    send: send.mutate,
    sending: send.isPending,
    sendError: send.error,
    markRead: markRead.mutate,
  };
}
