import { useEffect, useState } from "react";
import { useSharedRealtimeChannel } from "@/frontend/hooks/realtime";

export interface ActivityEvent {
  id: string;
  kind: "post" | "follow" | "signup";
  text: string;
  at: string;
}

/** Live admin monitor: realtime INSERTs on posts, follows and profiles. */
export function useLiveActivity(enabled: boolean) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!enabled) setConnected(false);
  }, [enabled]);

  useSharedRealtimeChannel(enabled ? "admin-live" : null, (channel) => {
    const push = (e: ActivityEvent) => setEvents((prev) => [e, ...prev].slice(0, 30));

    channel
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, (payload) => {
        const row = payload.new as { id: string; author_id: string; caption: string };
        push({
          id: `post-${row.id}`,
          kind: "post",
          text: `New post: “${row.caption.slice(0, 60) || "photo"}”`,
          at: new Date().toISOString(),
        });
      })
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "follows" },
        (payload) => {
          const row = payload.new as { follower_id: string; followee_id: string };
          push({
            id: `follow-${row.follower_id}-${row.followee_id}-${Date.now()}`,
            kind: "follow",
            text: "New follow",
            at: new Date().toISOString(),
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "profiles" },
        (payload) => {
          const row = payload.new as { id: string; username: string };
          push({
            id: `signup-${row.id}`,
            kind: "signup",
            text: `@${row.username} joined WIZZ`,
            at: new Date().toISOString(),
          });
        },
      )
      .subscribe((status) => setConnected(status === "SUBSCRIBED"));

    return () => {
      setConnected(false);
    };
  });

  return { events, connected };
}
