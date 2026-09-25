import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";
import { cacheStats, invalidate } from "../cache/redisCache";
import {
  EMPTY_PROFILE,
  getFeedPage,
  getHomeFeed,
  type InterestProfile,
} from "../services/feedService";
import { CURRENT_USER_ID } from "../database/seed";
import { optionalSupabaseAuth } from "@/integrations/supabase/optional-auth-middleware";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";

type HomeAuthContext = {
  supabase: SupabaseClient | null;
  userId: string | null;
};

function homeContext(context: unknown): HomeAuthContext {
  return context as HomeAuthContext;
}

function preventSharedCaching() {
  setResponseHeaders({ "Cache-Control": "private, no-store", Vary: "Authorization" } as never);
}

type HomeInput = { cursor?: string | null; profile?: unknown; scope?: "public" | "viewer" };

function cleanProfile(data: HomeInput | undefined): {
  cursor: string | null;
  profile: InterestProfile;
  scope: "public" | "viewer";
} {
  const raw = (data?.profile ?? {}) as Partial<InterestProfile>;
  const strArray = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, 200) : [];
  const watched: InterestProfile["watched"] = {};
  if (raw.watched && typeof raw.watched === "object") {
    for (const [k, v] of Object.entries(raw.watched).slice(0, 100)) {
      const w = v as { plays?: unknown; completed?: unknown } | null;
      if (w && typeof w === "object") {
        watched[k] = {
          plays: typeof w.plays === "number" ? Math.min(Math.max(0, Math.floor(w.plays)), 99) : 0,
          completed: w.completed === true,
        };
      }
    }
  }
  return {
    cursor: data?.cursor ?? null,
    scope: data?.scope === "viewer" ? "viewer" : "public",
    profile: {
      followingIds: strArray(raw.followingIds),
      savedCategories: strArray(raw.savedCategories),
      savedTags: strArray(raw.savedTags),
      mutedAuthorIds: strArray(raw.mutedAuthorIds),
      hiddenPostIds: strArray(raw.hiddenPostIds),
      notInterestedPostIds: strArray(raw.notInterestedPostIds),
      watched,
    },
  };
}

export const fetchHome = createServerFn({ method: "GET" })
  .middleware([optionalSupabaseAuth])
  .inputValidator((data: HomeInput | undefined) =>
    data?.profile !== undefined
      ? cleanProfile(data)
      : { cursor: data?.cursor ?? null, profile: EMPTY_PROFILE, scope: data?.scope ?? "public" },
  )
  .handler(async ({ context, data }) => {
    preventSharedCaching();
    if (data.scope !== "viewer") {
      return getHomeFeed(data.cursor, data.profile, null, undefined);
    }
    const viewer = homeContext(context);
    return getHomeFeed(data.cursor, data.profile, viewer.userId, viewer.supabase);
  });

export const fetchFeedPage = createServerFn({ method: "GET" })
  .middleware([optionalSupabaseAuth])
  .inputValidator((data: HomeInput | undefined) =>
    data?.profile !== undefined
      ? cleanProfile(data)
      : { cursor: data?.cursor ?? null, profile: EMPTY_PROFILE },
  )
  .handler(async ({ context, data }) => {
    preventSharedCaching();
    const viewer = homeContext(context);
    return getFeedPage(
      viewer.userId ?? CURRENT_USER_ID,
      data.cursor,
      data.profile,
      viewer.supabase,
    );
  });

/**
 * Bust home caches after a publish so new content appears instantly
 * instead of waiting out the 60s TTL. Best-effort — failures resolve true
 * anyway because TTLs still expire stale rows.
 */
export const invalidateHomeCache = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    preventSharedCaching();
    await Promise.all([
      invalidate.feedAll(),
      invalidate.candidates(),
      invalidate.stories(),
      invalidate.trending("global"),
    ]).catch(() => undefined);
    return { ok: true as const };
  });

/** Cache backend + hit/miss counters for Admin → System health. */
export const fetchCacheStats = createServerFn({ method: "GET" }).handler(async () => cacheStats());
