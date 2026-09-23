import { queryOptions } from "@tanstack/react-query";
import { fetchCacheStats, fetchFeedPage, fetchHome } from "@/backend/api/home.functions";
import type { InterestProfile } from "@/backend/services/feedService";
import { EMPTY_PROFILE } from "@/backend/services/feedService";

export const homeQueryOptions = queryOptions({
  queryKey: ["home", "feed", "start"],
  queryFn: () => fetchHome({ data: { cursor: null } }),
  staleTime: 30_000,
  // Transient RPC failures ("Failed to fetch" while the preview reconnects)
  // should retry instead of blanking the screen.
  retry: 3,
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
});

function profileHash(p: InterestProfile): string {
  const s = [
    p.followingIds.length,
    p.savedCategories.join(","),
    p.savedTags.slice(0, 8).join(","),
    p.mutedAuthorIds.length,
    p.hiddenPostIds.length,
    p.notInterestedPostIds.length,
    Object.keys(p.watched).length,
  ].join("|");
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h.toString(36);
}

/** Personalized first page. The generic SSR page stays as instant fallback. */
export const personalFeedQueryOptions = (profile: InterestProfile) =>
  queryOptions({
    queryKey: ["home", "feed", "personal", profileHash(profile)],
    queryFn: () => fetchHome({ data: { cursor: null, profile } }),
    staleTime: 30_000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
  });

export async function loadFeedPage(
  cursor: string | null,
  profile: InterestProfile = EMPTY_PROFILE,
) {
  return fetchFeedPage({ data: { cursor, profile } });
}

export const cacheStatsQueryOptions = queryOptions({
  queryKey: ["cache-stats"],
  queryFn: () => fetchCacheStats(),
  staleTime: 10_000,
  retry: false,
});
