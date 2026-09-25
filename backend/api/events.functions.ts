import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const EVENTS = new Set([
  "video_impression",
  "video_play",
  "video_pause",
  "video_progress",
  "video_complete",
  "video_replay",
  "video_like",
  "video_save",
  "video_share",
  "video_comment",
  "video_skip",
  "not_interested",
  "hide",
  "creator_mute",
]);

type EventInput = {
  event?: unknown;
  postId?: unknown;
  authorId?: unknown;
  meta?: unknown;
};

type FeedEventResult = { ok: true; count: number } | { ok: false; retryable: boolean };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isRetryableWrite(error: { code?: string; message: string }): boolean {
  if (/^(42501|42P01|42P10|42P16|22P02|23503|PGRST20[245]|PGRST202)/i.test(error.code ?? "")) {
    return false;
  }
  return !/unauthori[sz]ed|forbidden|jwt|permission|row.level|schema|column|relation|not found/i.test(
    error.message,
  );
}

/** Authenticated, validated analytics ingest. The caller controls no user id. */
export const recordFeedEvents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { events?: EventInput[] } | undefined) => ({
    events: Array.isArray(data?.events) ? data.events.slice(0, 50) : [],
  }))
  .handler(async ({ context, data }) => {
    const auth = context as unknown as {
      userId: string;
      supabase: SupabaseClient<Database>;
    };
    const userId = auth.userId;
    const rows = data.events.flatMap((event) => {
      if (typeof event.event !== "string" || !EVENTS.has(event.event)) return [];
      if (typeof event.postId !== "string" || !event.postId || event.postId.length > 160) {
        return [];
      }
      const authorId =
        typeof event.authorId === "string" && event.authorId.length <= 160
          ? event.authorId
          : undefined;
      const meta: Record<string, string | number | boolean> = {};
      if (event.meta && typeof event.meta === "object" && !Array.isArray(event.meta)) {
        for (const [key, value] of Object.entries(event.meta as Record<string, unknown>).slice(
          0,
          12,
        )) {
          if (typeof value === "string") meta[key.slice(0, 40)] = value.slice(0, 200);
          else if (typeof value === "number" || typeof value === "boolean") {
            meta[key.slice(0, 40)] = value;
          }
        }
      }
      return [
        {
          user_id: userId,
          event: event.event,
          post_id: event.postId,
          ...(authorId ? { author_id: authorId } : {}),
          meta,
        },
      ];
    });
    if (rows.length === 0) return { ok: true as const, count: 0 };

    // The service-role insert must not become an RLS bypass. First resolve post
    // ids through the authenticated client, then derive author_id server-side.
    const postIds = [
      ...new Set(rows.map((row) => row.post_id).filter((id) => UUID_PATTERN.test(id))),
    ];
    if (postIds.length === 0) return { ok: true as const, count: 0 };
    const { data: visiblePosts, error: visibilityError } = await auth.supabase
      .from("posts")
      .select("id, author_id")
      .in("id", postIds)
      .eq("status", "published")
      .limit(50);
    if (visibilityError) {
      return { ok: false as const, retryable: isRetryableWrite(visibilityError) };
    }
    const authorByPost = new Map(
      ((visiblePosts ?? []) as { id: string; author_id: string }[]).map((post) => [
        post.id,
        post.author_id,
      ]),
    );
    const authorizedRows = rows.flatMap((row) => {
      const authorId = authorByPost.get(row.post_id);
      return authorId ? [{ ...row, author_id: authorId }] : [];
    });
    if (authorizedRows.length === 0) return { ok: true as const, count: 0 };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("feed_events").insert(authorizedRows);
    if (error) {
      const result: FeedEventResult = {
        ok: false,
        retryable: isRetryableWrite(error),
      };
      return result;
    }
    return { ok: true as const, count: authorizedRows.length };
  });
