import { useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export type FeedEvent =
  | "video_impression"
  | "video_play"
  | "video_pause"
  | "video_progress"
  | "video_complete"
  | "video_replay"
  | "video_like"
  | "video_save"
  | "video_share"
  | "video_comment"
  | "video_skip"
  | "not_interested"
  | "hide"
  | "creator_mute";

const FLUSH_EVERY = 10;
const FLUSH_MS = 10_000;

interface Queued {
  event: FeedEvent;
  postId: string;
  authorId?: string | undefined;
  meta?: Record<string, string | number | boolean> | undefined;
}

/**
 * Fire-and-forget event tracker. Batches in memory, flushes every 10 events
 * or 10 seconds. Signed-out viewers buffer locally (dropped past 200).
 * Feeds post_stats via trigger → engagement-rate ranking.
 */
export function useEventTracker(userId: string | null) {
  const queue = useRef<Queued[]>([]);
  const userRef = useRef(userId);
  userRef.current = userId;

  const flush = useCallback(async () => {
    const batch = queue.current.splice(0, queue.current.length);
    if (batch.length === 0) return;
    const uid = userRef.current;
    if (!uid) return; // signed-out buffer stays local-only
    const { error } = await supabase.from("feed_events").insert(
      batch.map((e) => ({
        user_id: uid,
        event: e.event,
        post_id: e.postId,
        ...(e.authorId ? { author_id: e.authorId } : {}),
        meta: (e.meta ?? {}) as Record<string, string | number | boolean>,
      })),
    );
    if (error) {
      // 42501 = RLS denial (stale session / signed out mid-flush): drop the
      // batch instead of re-queuing forever. Anything else is transient.
      const denied = typeof error === "object" && (error as { code?: string }).code === "42501";
      if (!denied) queue.current = [...batch, ...queue.current].slice(0, 200);
      return;
    }
  }, []);

  useEffect(() => {
    const t = window.setInterval(() => void flush(), FLUSH_MS);
    window.addEventListener("beforeunload", flush);
    return () => {
      window.clearInterval(t);
      window.removeEventListener("beforeunload", flush);
      void flush();
    };
  }, [flush]);

  const track = useCallback(
    (event: FeedEvent, postId: string, extra?: { authorId?: string; meta?: Queued["meta"] }) => {
      queue.current.push({ event, postId, authorId: extra?.authorId, meta: extra?.meta });
      if (queue.current.length >= FLUSH_EVERY) void flush();
    },
    [flush],
  );

  return { track };
}
