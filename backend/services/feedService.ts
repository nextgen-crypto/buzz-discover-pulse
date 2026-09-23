/**
 * Home-screen read services — v2 personalized ranker.
 *
 * Pipeline (cheap → personal):
 *   Supabase/seed  →  global candidate cache (60s, identical for everyone)
 *                  →  per-user scoring (interest × relationship × diversity × quality)
 *                  →  three lanes (personalized / fresh / discovery, weighted)
 *                  →  diversity interleave (max 2 per creator per page)
 *                  →  stable cursor pages — no OFFSET anywhere.
 *
 * Viewer signals (follows, saves, mutes, hides, watch history) arrive as an
 * explicit InterestProfile input so the global cache stays shareable and
 * personalization happens after the cache, per request.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cacheAside, cacheKeys, TTL } from "../cache/redisCache";
import {
  CURRENT_USER_ID,
  creators,
  externalPosts,
  posts,
  shorts,
  stories,
  trending,
} from "../database/seed";
import type { CursorPage, Creator, Post, Story, TrendingTopic } from "../domain/types";

export interface FeedAuthor {
  id: string;
  username: string;
  displayName: string;
  avatarKey: string;
  verified: boolean;
}

export interface FeedItem {
  post: Post;
  author: FeedAuthor;
  /** Short-form clip attached to the card, when the ranker picked video. */
  clipObjectKey?: string;
  /** Owner-uploaded video (signed URL). Takes precedence over clipObjectKey. */
  videoSrc?: string;
}

export interface StoryItem {
  story: Story;
  author: FeedAuthor;
}

export interface HomeFeed {
  currentUser: Creator;
  stories: StoryItem[];
  trending: TrendingTopic[];
  feed: CursorPage<FeedItem>;
}

/** Viewer signals. Everything is optional — missing pieces degrade to neutral. */
export interface InterestProfile {
  followingIds: string[];
  savedCategories: string[];
  savedTags: string[];
  mutedAuthorIds: string[];
  hiddenPostIds: string[];
  notInterestedPostIds: string[];
  watched: Record<string, { plays: number; completed: boolean }>;
}

export const EMPTY_PROFILE: InterestProfile = {
  followingIds: [],
  savedCategories: [],
  savedTags: [],
  mutedAuthorIds: [],
  hiddenPostIds: [],
  notInterestedPostIds: [],
  watched: {},
};

/** Lane allocation. Tune without touching the ranker. */
export const LANE_WEIGHTS = { personalized: 0.5, fresh: 0.3, discovery: 0.2 } as const;

/**
 * Adaptive lanes: cold-start users get mostly fresh+discovery, established
 * users get mostly personalized. Thresholds are signal counts, not magic.
 */
export function laneWeightsFor(profile: InterestProfile): {
  personalized: number;
  fresh: number;
  discovery: number;
} {
  const signals =
    profile.followingIds.length +
    profile.savedCategories.length +
    profile.savedTags.length +
    Object.keys(profile.watched).length;
  if (signals < 5) return { personalized: 0.2, fresh: 0.5, discovery: 0.3 };
  if (signals < 40) return { ...LANE_WEIGHTS };
  return { personalized: 0.65, fresh: 0.2, discovery: 0.15 };
}

/** Hard caps so multipliers compose without exploding or collapsing scores. */
const CAPS = { interest: 1.8, relationship: 1.6, watch: 1.5, negativeMin: 0.1 } as const;

const PAGE_SIZE = 6;
const REAL_POST_LIMIT = 120;
const MAX_CREATOR_PER_PAGE = 2;

const byId = new Map(creators.map((c) => [c.id, c]));

/** Anonymous server-side reader. RLS grants public SELECT on profiles/posts/follows. */
let anonClient: SupabaseClient | null | undefined;
function serverSupabase(): SupabaseClient | null {
  if (anonClient !== undefined) return anonClient;
  const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"];
  const key =
    process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) {
    anonClient = null;
    return anonClient;
  }
  anonClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return anonClient;
}

interface RealPostRow {
  id: string;
  author_id: string;
  caption: string;
  image_url: string | null;
  video_url?: string | null;
  hashtags: string[];
  location: string | null;
  category: string;
  created_at: string;
}

interface RealProfileRow {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  verified: boolean;
}

function toAuthor(id: string): FeedAuthor {
  const c = byId.get(id);
  if (!c) throw new Error(`Unknown creator ${id}`);
  return {
    id: c.id,
    username: c.username,
    displayName: c.displayName,
    avatarKey: c.avatarKey,
    verified: c.verified,
  };
}

/** Engagement-weighted recency for the static discovery lane (deterministic). */
function seedRank(post: Post): number {
  const ageHours =
    (Date.parse("2026-08-27T12:00:00.000Z") - Date.parse(post.createdAt)) / 3_600_000;
  const engagement =
    post.metrics.likes +
    post.metrics.comments * 4 +
    post.metrics.saves * 3 +
    post.metrics.shares * 5;
  return engagement / Math.pow(ageHours + 2, 1.35);
}

function rankedSeedPosts(): Post[] {
  return [...posts, ...externalPosts]
    .filter((p) => p.visibility === "public" && p.moderationStatus === "approved")
    .sort((a, b) => seedRank(b) - seedRank(a));
}

interface RealCandidate {
  item: FeedItem;
  followers: number;
}

/** Posts select that tolerates a pre-part7 backend (no video_url yet). */
async function tryRealSelect(
  supabase: NonNullable<ReturnType<typeof serverSupabase>>,
): Promise<{ data: unknown[] | null; error: unknown }> {
  const full = await supabase
    .from("posts")
    .select("id, author_id, caption, image_url, video_url, hashtags, location, category, created_at")
    .order("created_at", { ascending: false })
    .limit(REAL_POST_LIMIT);
  if (!full.error) return { data: full.data as unknown[], error: null };
  const legacy = await supabase
    .from("posts")
    .select("id, author_id, caption, image_url, hashtags, location, category, created_at")
    .order("created_at", { ascending: false })
    .limit(REAL_POST_LIMIT);
  return { data: legacy.data as unknown[] | null, error: legacy.error };
}

async function fetchRealCandidates(): Promise<RealCandidate[]> {
  const supabase = serverSupabase();
  if (!supabase) return [];
  const { data: rows, error } = await tryRealSelect(supabase);
  if (error || !rows || rows.length === 0) return [];
  const real = rows as RealPostRow[];

  const authorIds = [...new Set(real.map((p) => p.author_id))];
  const [{ data: profileRows }, { data: followRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, verified")
      .in("id", authorIds),
    supabase.from("follows").select("followee_id").in("followee_id", authorIds).limit(5000),
  ]);
  const profiles = new Map(((profileRows ?? []) as RealProfileRow[]).map((p) => [p.id, p]));
  const followerCount = new Map<string, number>();
  for (const row of (followRows ?? []) as { followee_id: string }[]) {
    followerCount.set(row.followee_id, (followerCount.get(row.followee_id) ?? 0) + 1);
  }

  const out: RealCandidate[] = [];
  for (const row of real) {
    const profile = profiles.get(row.author_id);
    if (!profile) continue;
    const post: Post = {
      id: row.id,
      authorId: row.author_id,
      source: "buzz",
      caption: row.caption,
      media: row.image_url
        ? [
            {
              kind: "image",
              objectKey: row.image_url,
              width: 1080,
              height: 1080,
              blurColor: "#888",
              alt: row.caption.slice(0, 80) || "Post photo",
            },
          ]
        : [],
      hashtags: row.hashtags ?? [],
      ...(row.location ? { location: row.location } : {}),
      category: row.category,
      metrics: { likes: 0, comments: 0, shares: 0, saves: 0, views: 0 },
      createdAt: row.created_at,
      visibility: "public",
      moderationStatus: "approved",
    };
    out.push({
      item: {
        post,
        author: {
          id: profile.id,
          username: profile.username,
          displayName: profile.display_name,
          avatarKey: profile.avatar_url ?? "",
          verified: profile.verified,
        },
        ...(row.video_url ? { videoSrc: row.video_url } : {}),
      },
      followers: followerCount.get(row.author_id) ?? 0,
    });
  }
  return out;
}

interface Candidates {
  real: RealCandidate[];
  seed: FeedItem[];
  /** Public per-post impression counts for engagement-rate ranking. */
  stats: Map<string, number>;
}

/** Global candidate pool — identical for every viewer, safe to cache. */
async function getCandidates(): Promise<Candidates> {
  return cacheAside("candidates:global", TTL.feed, async () => {
    const [real, seedPosts, stats] = await Promise.all([
      fetchRealCandidates().catch(() => [] as RealCandidate[]),
      Promise.resolve(rankedSeedPosts()),
      fetchPostStats().catch(() => new Map<string, number>()),
    ]);
    const seed: FeedItem[] = seedPosts.map((post, i) => {
      const clip = shorts[i % shorts.length];
      const attachVideo = post.media.length === 0 || i % 3 === 2;
      return {
        post,
        author: toAuthor(post.authorId),
        ...(attachVideo && clip ? { clipObjectKey: clip.video.objectKey } : {}),
      };
    });
    return { real, seed, stats };
  });
}

/** Public impression counters for rate-based discovery (empty until migration). */
async function fetchPostStats(): Promise<Map<string, number>> {
  const supabase = serverSupabase();
  if (!supabase) return new Map();
  const { data, error } = await supabase
    .from("post_stats")
    .select("post_id, impressions")
    .limit(2000);
  if (error || !data) return new Map();
  const map = new Map<string, number>();
  for (const row of data as { post_id: string; impressions: number }[]) {
    map.set(row.post_id, row.impressions);
  }
  return map;
}

/** Sanitize viewer input: cap sizes so a hostile client can't blow up ranking. */
function sanitizeProfile(p: InterestProfile | null | undefined): InterestProfile {
  if (!p || typeof p !== "object") return EMPTY_PROFILE;
  const cap = <T>(v: unknown, isOk: (x: unknown) => x is T): T[] =>
    Array.isArray(v) ? v.filter(isOk).slice(0, 200) : [];
  const isStr = (x: unknown): x is string => typeof x === "string" && x.length <= 120;
  const watched: InterestProfile["watched"] = {};
  if (p.watched && typeof p.watched === "object") {
    for (const [k, v] of Object.entries(p.watched).slice(0, 100)) {
      if (typeof k === "string" && v && typeof v === "object") {
        const w = v as { plays?: unknown; completed?: unknown };
        watched[k.slice(0, 120)] = {
          plays: typeof w.plays === "number" ? Math.min(Math.max(0, Math.floor(w.plays)), 99) : 0,
          completed: w.completed === true,
        };
      }
    }
  }
  return {
    followingIds: cap(p.followingIds, isStr),
    savedCategories: cap(p.savedCategories, isStr).map((s) => s.toLowerCase()),
    savedTags: cap(p.savedTags, isStr).map((s) => s.toLowerCase()),
    mutedAuthorIds: cap(p.mutedAuthorIds, isStr),
    hiddenPostIds: cap(p.hiddenPostIds, isStr),
    notInterestedPostIds: cap(p.notInterestedPostIds, isStr),
    watched,
  };
}

interface Scored {
  item: FeedItem;
  score: number;
  lane: "personalized" | "fresh" | "discovery";
}

/**
 * Per-user scoring. Multiplicative so signals compose; every unknown signal
 * degrades to ×1 instead of breaking the feed.
 */
function scoreCandidate(
  item: FeedItem,
  followers: number,
  isSeed: boolean,
  now: number,
  profile: InterestProfile,
): Scored | null {
  const { post, author } = item;
  if (profile.mutedAuthorIds.includes(author.id)) return null;
  if (profile.hiddenPostIds.includes(post.id)) return null;

  const ageHours = Math.max(0, (now - Date.parse(post.createdAt)) / 3_600_000);
  if (!Number.isFinite(ageHours)) return null;
  const recency = Math.exp(-ageHours / 24);
  // Deliberately weak authority: logarithmic AND capped, so follower count can
  // never dominate. Content signals carry the ranking.
  const authority = Math.min(1 + 0.25 * Math.log10(1 + followers), 1.5);
  const mediaBoost = post.media.length > 0 ? 1.25 : 1;
  const base = recency * authority * mediaBoost * 1000;

  let interest = 1;
  if (profile.savedCategories.includes(post.category.toLowerCase())) interest *= 1.3;
  const tagOverlap = post.hashtags.filter((h) =>
    profile.savedTags.includes(h.toLowerCase()),
  ).length;
  if (tagOverlap > 0) interest *= Math.min(1 + 0.15 * tagOverlap, 1.45);
  interest = Math.min(interest, CAPS.interest);

  let relationship = 1;
  if (profile.followingIds.includes(author.id)) relationship *= CAPS.relationship;

  let watch = 1;
  const w = profile.watched[post.id];
  if (w) {
    if (w.completed) watch *= 1.4;
    else if (w.plays >= 2) watch *= 1.3;
    else if (w.plays >= 1) watch *= 1.1;
  }
  watch = Math.min(watch, CAPS.watch);

  let negative = 1;
  if (profile.notInterestedPostIds.includes(post.id)) negative *= CAPS.negativeMin;

  const score = base * interest * relationship * watch * negative;
  const personalized = interest > 1 || relationship > 1;
  return { item, score, lane: personalized ? "personalized" : isSeed ? "discovery" : "fresh" };
}

/** Smooth weighted round-robin across non-empty lanes. */
function interleaveLanes(
  queues: Record<Scored["lane"], Scored[]>,
  weights: { personalized: number; fresh: number; discovery: number },
): Scored[] {
  const order: Scored["lane"][] = ["personalized", "fresh", "discovery"];
  const credits: Record<Scored["lane"], number> = { personalized: 0, fresh: 0, discovery: 0 };
  const out: Scored[] = [];
  const remaining = () => order.some((lane) => queues[lane].length > 0);
  while (remaining()) {
    for (const lane of order) credits[lane] += weights[lane];
    let best: Scored["lane"] | null = null;
    for (const lane of order) {
      if (queues[lane].length === 0) continue;
      if (best === null || credits[lane] > credits[best]) best = lane;
    }
    if (best === null) break;
    const total = order.reduce((s, lane) => s + (queues[lane].length > 0 ? weights[lane] : 0), 0);
    credits[best] -= total;
    out.push(queues[best].shift()!);
  }
  return out;
}

/**
 * Discovery scoring with engagement RATE once impressions exist:
 *   rate = engagement / max(impressions, 1), decayed over ~3 days.
 * Falls back to the legacy count formula while stats accumulate.
 */
function scoreDiscovery(
  item: FeedItem,
  now: number,
  profile: InterestProfile,
  impressions: number,
): Scored | null {
  const { post, author } = item;
  if (profile.mutedAuthorIds.includes(author.id)) return null;
  if (profile.hiddenPostIds.includes(post.id)) return null;
  const engagement =
    post.metrics.likes +
    post.metrics.comments * 4 +
    post.metrics.saves * 3 +
    post.metrics.shares * 5;
  let score: number;
  if (impressions > 0 && Number.isFinite(Date.parse(post.createdAt))) {
    const ageHours = Math.max(0, (now - Date.parse(post.createdAt)) / 3_600_000);
    score = (engagement / Math.max(impressions, 1)) * Math.exp(-ageHours / 72) * 1000;
  } else {
    score = seedRank(post);
  }
  if (profile.notInterestedPostIds.includes(post.id)) score *= CAPS.negativeMin;
  let interest = 1;
  if (profile.savedCategories.includes(post.category.toLowerCase())) interest *= 1.3;
  const overlap = post.hashtags.filter((h) => profile.savedTags.includes(h.toLowerCase())).length;
  if (overlap > 0) interest *= Math.min(1 + 0.15 * overlap, 1.45);
  interest = Math.min(interest, CAPS.interest);
  const followed = profile.followingIds.includes(author.id);
  if (followed) score *= CAPS.relationship;
  score *= interest;
  return { item, score, lane: interest > 1 || followed ? "personalized" : "discovery" };
}

/** Exploration: is this outside everything the viewer already likes? */
function isExploreItem(item: FeedItem, profile: InterestProfile): boolean {
  const signals =
    profile.followingIds.length +
    profile.savedCategories.length +
    profile.savedTags.length +
    Object.keys(profile.watched).length;
  if (signals < 5) return false; // cold-start feeds are already all-exploration
  const { post, author } = item;
  if (profile.followingIds.includes(author.id)) return false;
  if (profile.savedCategories.includes(post.category.toLowerCase())) return false;
  if (post.hashtags.some((h) => profile.savedTags.includes(h.toLowerCase()))) return false;
  if (profile.watched[post.id]) return false;
  return true;
}

/** Guarantee fresh blood near the top: pull one explore item into slot 3. */
function ensureExploration(ordered: Scored[], profile: InterestProfile): Scored[] {
  if (ordered.slice(0, PAGE_SIZE).some((s) => isExploreItem(s.item, profile))) return ordered;
  const idx = ordered.findIndex((s, i) => i >= PAGE_SIZE && isExploreItem(s.item, profile));
  if (idx < 0) return ordered;
  const picked = ordered[idx];
  if (!picked) return ordered;
  const next = [...ordered];
  next.splice(idx, 1);
  next.splice(Math.min(2, next.length), 0, picked);
  return next;
}
function diversify(items: Scored[], maxPerCreator: number): Scored[] {
  const counts = new Map<string, number>();
  const out: Scored[] = [];
  const deferred: Scored[] = [];
  for (const s of items) {
    const n = counts.get(s.item.author.id) ?? 0;
    if (n >= maxPerCreator) {
      deferred.push(s);
      continue;
    }
    counts.set(s.item.author.id, n + 1);
    out.push(s);
  }
  return [...out, ...deferred];
}

interface FeedCursor {
  id: string;
  s: number;
  t: string;
  n: number;
}

function encodeCursor(c: FeedCursor): string {
  return Buffer.from(JSON.stringify(c)).toString("base64url");
}

function decodeCursor(cursor: string | null): (FeedCursor & { fresh: boolean }) | null {
  if (!cursor) return null;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as FeedCursor;
    if (typeof parsed.id !== "string" || typeof parsed.s !== "number") return null;
    return { ...parsed, fresh: false };
  } catch {
    return null; // legacy / corrupt cursor → restart from the top
  }
}

type RankTuple = { s: number; t: string; id: string };

function tupleAfter(a: RankTuple, cur: FeedCursor): boolean {
  if (a.s !== cur.s) return a.s < cur.s;
  if (a.t !== cur.t) return a.t < cur.t;
  return a.id > cur.id;
}

async function rankAll(
  profile: InterestProfile,
  now: number,
): Promise<{ items: FeedItem[]; tuples: RankTuple[] }> {
  const { real, seed, stats } = await getCandidates();
  const weights = laneWeightsFor(profile);
  const queues: Record<Scored["lane"], Scored[]> = { personalized: [], fresh: [], discovery: [] };
  for (const r of real) {
    const s = scoreCandidate(r.item, r.followers, false, now, profile);
    if (s) queues[s.lane].push(s);
  }
  for (const item of seed) {
    const s = scoreDiscovery(item, now, profile, stats.get(item.post.id) ?? 0);
    if (s) queues[s.lane].push(s);
  }
  for (const lane of Object.keys(queues) as Scored["lane"][]) {
    queues[lane].sort(
      (a, b) => b.score - a.score || b.item.post.createdAt.localeCompare(a.item.post.createdAt),
    );
  }
  const ordered = ensureExploration(
    diversify(interleaveLanes(queues, weights), MAX_CREATOR_PER_PAGE),
    profile,
  );
  return {
    items: ordered.map((s) => s.item),
    tuples: ordered.map((s) => ({
      s: Math.round(s.score * 1000) / 1000,
      t: s.item.post.createdAt,
      id: s.item.post.id,
    })),
  };
}

export async function getFeedPage(
  userId: string,
  cursor: string | null,
  profile?: InterestProfile | null,
): Promise<CursorPage<FeedItem>> {
  const clean = sanitizeProfile(profile);
  // Pin "now" inside the cursor so every page of a session ranks identically.
  const decoded = decodeCursor(cursor);
  const now = decoded && Number.isFinite(decoded.n) ? decoded.n : Date.now();
  const cacheKey = decoded ? cursor! : "start";
  return cacheAside(cacheKeys.feed(userId, cacheKey), TTL.feed, async () => {
    const { items, tuples } = await rankAll(clean, now);
    let startIndex = 0;
    if (decoded) {
      const idx = tuples.findIndex((t, i) => items[i]?.post.id === decoded.id);
      if (idx >= 0) {
        startIndex = idx + 1;
      } else {
        startIndex = tuples.findIndex((t) => tupleAfter(t, decoded));
        if (startIndex < 0) startIndex = items.length;
      }
    }
    const slice = items.slice(startIndex, startIndex + PAGE_SIZE);
    const sliceTuples = tuples.slice(startIndex, startIndex + PAGE_SIZE);
    const last = slice[slice.length - 1];
    const lastTuple = sliceTuples[sliceTuples.length - 1];
    const hasMore = startIndex + slice.length < items.length;
    return {
      items: slice,
      nextCursor: hasMore && last && lastTuple ? encodeCursor({ ...lastTuple, n: now }) : null,
      hasMore,
    };
  });
}

export async function getStoryRail(userId: string): Promise<StoryItem[]> {
  return cacheAside(`stories:${userId}`, TTL.feed, async () =>
    [...stories]
      .sort((a, b) => Number(a.viewed) - Number(b.viewed) || b.createdAt.localeCompare(a.createdAt))
      .map((story) => ({ story, author: toAuthor(story.authorId) })),
  );
}

export async function getTrending(region: string): Promise<TrendingTopic[]> {
  return cacheAside(cacheKeys.trending(region), TTL.trending, async () => {
    const real = await fetchRealTrending(Date.now()).catch(() => [] as TrendingTopic[]);
    // Real community tags lead; seed catalogue fills the rail while it grows.
    const seen = new Set(real.map((t) => t.label.toLowerCase()));
    const fallback = [...trending]
      .sort((a, b) => b.velocity - a.velocity)
      .filter((t) => !seen.has(t.label.toLowerCase()));
    return [...real, ...fallback].slice(0, 8);
  });
}

/** Real hashtag velocity: last-7d mentions weighted against the prior 7d. */
async function fetchRealTrending(now: number): Promise<TrendingTopic[]> {
  const supabase = serverSupabase();
  if (!supabase) return [];
  const since = new Date(now - 14 * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from("posts")
    .select("hashtags, created_at")
    .gte("created_at", since)
    .limit(1000);
  if (error || !data) return [];
  const week = 7 * 86_400_000;
  const recent = new Map<string, number>();
  const prior = new Map<string, number>();
  for (const row of data as { hashtags: string[]; created_at: string }[]) {
    const bucket = now - Date.parse(row.created_at) <= week ? recent : prior;
    for (const tag of row.hashtags ?? []) {
      const clean = tag.trim().toLowerCase();
      if (clean) bucket.set(clean, (bucket.get(clean) ?? 0) + 1);
    }
  }
  return [...recent.entries()]
    .map(([tag, count]) => ({
      id: `tag-${tag}`,
      label: `#${tag}`,
      kind: "hashtag" as const,
      category: "Trending",
      postCount: count,
      velocity: count * 2 - (prior.get(tag) ?? 0),
      region: "global",
    }))
    .filter((t) => t.velocity > 0)
    .sort((a, b) => b.velocity - a.velocity)
    .slice(0, 8);
}

export async function getHomeFeed(
  cursor: string | null,
  profile?: InterestProfile | null,
): Promise<HomeFeed> {
  const userId = CURRENT_USER_ID;
  const [storyRail, topics, feed] = await Promise.all([
    getStoryRail(userId),
    getTrending("global"),
    getFeedPage(userId, cursor, profile),
  ]);
  const currentUser = byId.get(userId)!;
  return { currentUser, stories: storyRail, trending: topics, feed };
}
