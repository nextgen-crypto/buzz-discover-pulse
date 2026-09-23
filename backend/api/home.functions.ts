import { createServerFn } from "@tanstack/react-start";
import { cacheStats, invalidate } from "../cache/redisCache";
import {
  EMPTY_PROFILE,
  getFeedPage,
  getHomeFeed,
  type InterestProfile,
} from "../services/feedService";
import { CURRENT_USER_ID } from "../database/seed";

function cleanProfile(data: { cursor?: string | null; profile?: unknown } | undefined): {
  cursor: string | null;
  profile: InterestProfile;
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
  .inputValidator((data: { cursor?: string | null; profile?: unknown } | undefined) =>
    data?.profile !== undefined
      ? cleanProfile(data)
      : { cursor: data?.cursor ?? null, profile: EMPTY_PROFILE },
  )
  .handler(async ({ data }) => getHomeFeed(data.cursor, data.profile));

export const fetchFeedPage = createServerFn({ method: "GET" })
  .inputValidator((data: { cursor?: string | null; profile?: unknown } | undefined) =>
    data?.profile !== undefined
      ? cleanProfile(data)
      : { cursor: data?.cursor ?? null, profile: EMPTY_PROFILE },
  )
  .handler(async ({ data }) => getFeedPage(CURRENT_USER_ID, data.cursor, data.profile));

/**
 * Bust home caches after a publish so new content appears instantly
 * instead of waiting out the 60s TTL. Best-effort — failures resolve true
 * anyway because TTLs still expire stale rows.
 */
export const invalidateHomeCache = createServerFn({ method: "POST" }).handler(async () => {
  await Promise.all([
    invalidate.feed(CURRENT_USER_ID),
    invalidate.candidates(),
    invalidate.trending("global"),
  ]).catch(() => undefined);
  return { ok: true as const };
});

/** Cache backend + hit/miss counters for Admin → System health. */
export const fetchCacheStats = createServerFn({ method: "GET" }).handler(async () => cacheStats());
