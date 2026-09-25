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
import type { CursorPage, Creator, Post, TrendingTopic } from "../domain/types";
import { imageUrl, videoUrl } from "../domain/media";
import { createKeyAwareSupabaseFetch } from "../integrations/supabase/key-aware-fetch";

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
  /** Owner-uploaded video (short-lived signed URL). Takes precedence over clipObjectKey. */
  videoSrc?: string;
  /** Internal canonical paths, resolved only for the returned page slice. */
  imagePath?: string;
  videoPath?: string;
}

export interface StoryItem {
  id: string;
  author: FeedAuthor;
  mediaUrl: string;
  mediaType: "image" | "video" | "text";
  caption: string;
  background: string;
  overlays: string[];
  createdAt: string;
  expiresAt: string | null;
  viewed: boolean;
  real: boolean;
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

/**
 * Server reader supplied by optional auth middleware. The process-local fallback
 * remains anonymous for direct service calls and zero-config/demo environments.
 */
let anonClient: SupabaseClient | null | undefined;
function serverSupabase(viewerClient?: SupabaseClient | null): SupabaseClient | null {
  if (viewerClient !== undefined) return viewerClient;
  if (anonClient !== undefined) return anonClient;
  const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"];
  const key =
    process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) {
    anonClient = null;
    return anonClient;
  }
  anonClient = createClient(url, key, {
    global: { fetch: createKeyAwareSupabaseFetch(key) },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return anonClient;
}

const MEDIA_URL_TTL_SECONDS = 5 * 60;

async function signStoredMedia(
  supabase: SupabaseClient,
  path: string | null | undefined,
  transform?: { width: number; quality: number },
): Promise<string | null> {
  if (!path) return null;
  const result = await supabase.storage
    .from("post-images")
    .createSignedUrl(path, MEDIA_URL_TTL_SECONDS, transform ? { transform } : undefined);
  return result.error ? null : result.data.signedUrl;
}

async function signStoredMediaBatch(
  supabase: SupabaseClient,
  paths: string[],
): Promise<Map<string, string>> {
  const uniquePaths = [...new Set(paths.filter(Boolean))];
  if (uniquePaths.length === 0) return new Map();
  const result = await supabase.storage
    .from("post-images")
    .createSignedUrls(uniquePaths, MEDIA_URL_TTL_SECONDS);
  if (result.error || !result.data) return new Map();
  return new Map(
    result.data.flatMap((item) =>
      item.path && item.signedUrl && !item.error ? [[item.path, item.signedUrl] as const] : [],
    ),
  );
}

interface RealPostRow {
  id: string;
  author_id: string;
  caption: string;
  image_url: string | null;
  image_path?: string | null;
  video_url?: string | null;
  video_path?: string | null;
  comments_count?: number;
  comments_enabled?: boolean;
  allow_sharing?: boolean;
  visibility?: string;
  status?: string;
  content_kind?: string;
  scheduled_at?: string | null;
  story_expires_at?: string | null;
  story_overlays?: string[];
  story_background?: string | null;
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

function isMissingSchemaError(error: unknown): boolean {
  const candidate = error as { code?: unknown; message?: unknown } | null;
  const code = typeof candidate?.code === "string" ? candidate.code : "";
  const message = typeof candidate?.message === "string" ? candidate.message : "";
  return (
    /^(42703|42P01|PGRST20[45])$/i.test(code) ||
    /column .* does not exist|relation .* does not exist|schema cache/i.test(message)
  );
}

/** Posts select that tolerates projects that have not applied the newest posting migration. */
async function tryRealSelect(
  supabase: NonNullable<ReturnType<typeof serverSupabase>>,
): Promise<{ data: unknown[] | null; error: unknown }> {
  const full = await supabase
    .from("posts")
    .select(
      "id, author_id, caption, image_url, image_path, video_url, video_path, comments_count, comments_enabled, allow_sharing, visibility, status, content_kind, scheduled_at, story_expires_at, story_overlays, story_background, hashtags, location, category, created_at",
    )
    .eq("status", "published")
    .eq("content_kind", "post")
    .or(`scheduled_at.is.null,scheduled_at.lte.${new Date().toISOString()}`)
    .order("created_at", { ascending: false })
    .limit(REAL_POST_LIMIT);
  if (!full.error) return { data: full.data as unknown[], error: null };
  if (!isMissingSchemaError(full.error)) {
    return { data: null, error: full.error };
  }

  const compatible = await supabase
    .from("posts")
    .select(
      "id, author_id, caption, image_url, video_url, comments_count, comments_enabled, visibility, hashtags, location, category, created_at",
    )
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(REAL_POST_LIMIT);
  if (!compatible.error) {
    return { data: compatible.data as unknown[], error: null };
  }
  if (!isMissingSchemaError(compatible.error)) {
    return { data: null, error: compatible.error };
  }

  const legacy = await supabase
    .from("posts")
    .select("id, author_id, caption, image_url, hashtags, location, category, created_at")
    .order("created_at", { ascending: false })
    .limit(REAL_POST_LIMIT);
  return { data: legacy.data as unknown[] | null, error: legacy.error };
}

async function fetchRealCandidates(viewerClient?: SupabaseClient | null): Promise<RealCandidate[]> {
  const supabase = serverSupabase(viewerClient);
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
    const imageKey = row.image_path || row.image_url;
    const post: Post = {
      id: row.id,
      authorId: row.author_id,
      source: "buzz",
      caption: row.caption,
      media: imageKey
        ? [
            {
              kind: "image",
              objectKey: imageKey,
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
      metrics: {
        likes: 0,
        comments: row.comments_count ?? 0,
        shares: 0,
        saves: 0,
        views: 0,
      },
      createdAt: row.created_at,
      visibility:
        row.visibility === "followers" || row.visibility === "private" ? row.visibility : "public",
      commentsEnabled: row.comments_enabled !== false,
      allowSharing: row.allow_sharing !== false,
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
        ...(row.image_path ? { imagePath: row.image_path } : {}),
        ...(row.video_path ? { videoPath: row.video_path } : {}),
      },
      followers: followerCount.get(row.author_id) ?? 0,
    });
  }
  return out;
}

async function resolveFeedItemMedia(
  items: FeedItem[],
  viewerClient?: SupabaseClient | null,
): Promise<FeedItem[]> {
  const supabase = serverSupabase(viewerClient);
  if (!supabase) {
    return items.map(({ imagePath: _imagePath, videoPath: _videoPath, ...item }) => item);
  }
  return Promise.all(
    items.map(async ({ imagePath, videoPath, ...item }) => {
      const [imageUrl, videoUrl] = await Promise.all([
        signStoredMedia(supabase, imagePath, { width: 1280, quality: 75 }),
        signStoredMedia(supabase, videoPath),
      ]);
      return {
        ...item,
        post: {
          ...item.post,
          media: imageUrl
            ? item.post.media.map((media) =>
                media.kind === "image" ? { ...media, objectKey: imageUrl } : media,
              )
            : imagePath
              ? item.post.media.filter((media) => media.kind !== "image")
              : item.post.media,
        },
        ...(videoUrl ? { videoSrc: videoUrl } : {}),
      };
    }),
  );
}

interface Candidates {
  real: RealCandidate[];
  seed: FeedItem[];
  /** Public per-post impression counts for engagement-rate ranking. */
  stats: Map<string, number>;
}

/** Viewer-scoped candidate pool. RLS can expose different rows to each user. */
async function getCandidates(
  viewerId: string,
  viewerClient?: SupabaseClient | null,
): Promise<Candidates> {
  const load = async (): Promise<Candidates> => {
    const [real, seedPosts, stats] = await Promise.all([
      fetchRealCandidates(viewerClient).catch(() => [] as RealCandidate[]),
      Promise.resolve(rankedSeedPosts()),
      fetchPostStats(viewerClient).catch(() => new Map<string, number>()),
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
  };

  // Shared caching is safe only for the anonymous viewer. Authenticated rows
  // must be re-read after blocks, follows, privacy, or visibility changes.
  return viewerId === CURRENT_USER_ID
    ? cacheAside(cacheKeys.candidates(viewerId), TTL.feed, load)
    : load();
}

/** Public impression counters for rate-based discovery (empty until migration). */
async function fetchPostStats(viewerClient?: SupabaseClient | null): Promise<Map<string, number>> {
  const supabase = serverSupabase(viewerClient);
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
  viewerId: string,
  viewerClient?: SupabaseClient | null,
): Promise<{ items: FeedItem[]; tuples: RankTuple[] }> {
  const { real, seed, stats } = await getCandidates(viewerId, viewerClient);
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

function profileCacheKey(profile: InterestProfile): string {
  const serialized = JSON.stringify({
    followingIds: [...profile.followingIds].sort(),
    savedCategories: [...profile.savedCategories].sort(),
    savedTags: [...profile.savedTags].sort(),
    mutedAuthorIds: [...profile.mutedAuthorIds].sort(),
    hiddenPostIds: [...profile.hiddenPostIds].sort(),
    notInterestedPostIds: [...profile.notInterestedPostIds].sort(),
    watched: Object.entries(profile.watched).sort(([a], [b]) => a.localeCompare(b)),
  });
  let hash = 2166136261;
  for (let i = 0; i < serialized.length; i++) {
    hash ^= serialized.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export async function getFeedPage(
  userId: string,
  cursor: string | null,
  profile?: InterestProfile | null,
  viewerClient?: SupabaseClient | null,
): Promise<CursorPage<FeedItem>> {
  const clean = sanitizeProfile(profile);
  // Pin "now" inside the cursor so every page of a session ranks identically.
  const decoded = decodeCursor(cursor);
  const now = decoded && Number.isFinite(decoded.n) ? decoded.n : Date.now();
  const cacheKey = decoded ? cursor! : "start";
  const load = async (): Promise<CursorPage<FeedItem>> => {
    const { items, tuples } = await rankAll(clean, now, userId, viewerClient);
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
    const resolvedSlice = await resolveFeedItemMedia(slice, viewerClient);
    return {
      items: resolvedSlice,
      nextCursor: hasMore && last && lastTuple ? encodeCursor({ ...lastTuple, n: now }) : null,
      hasMore,
    };
  };

  return userId === CURRENT_USER_ID
    ? cacheAside(cacheKeys.feed(userId, cacheKey, profileCacheKey(clean)), TTL.feed, load)
    : load();
}

interface RealStoryRow {
  id: string;
  author_id: string;
  caption: string;
  image_url: string | null;
  image_path: string | null;
  video_url: string | null;
  video_path: string | null;
  story_background: string | null;
  story_overlays: string[];
  created_at: string;
  story_expires_at: string;
}

async function fetchRealStories(viewerClient?: SupabaseClient | null): Promise<StoryItem[]> {
  const supabase = serverSupabase(viewerClient);
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, author_id, caption, image_url, image_path, video_url, video_path, story_background, story_overlays, created_at, story_expires_at",
    )
    .eq("status", "published")
    .eq("content_kind", "story")
    .gt("story_expires_at", new Date().toISOString())
    .order("story_expires_at", { ascending: false })
    .limit(50);
  if (error || !data?.length) return [];

  const rows = data as unknown as RealStoryRow[];
  const authorIds = [...new Set(rows.map((row) => row.author_id))];
  const { data: profileRows } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, verified")
    .in("id", authorIds);
  const profiles = new Map(
    ((profileRows ?? []) as RealProfileRow[]).map((profile) => [profile.id, profile]),
  );

  const signedMedia = await signStoredMediaBatch(
    supabase,
    rows.flatMap((row) =>
      [row.image_path, row.video_path].filter((path): path is string => !!path),
    ),
  );
  return rows.flatMap((row) => {
    const profile = profiles.get(row.author_id);
    if (!profile) return [];
    const imageUrl = (row.image_path ? signedMedia.get(row.image_path) : null) ?? row.image_url;
    const videoUrl = (row.video_path ? signedMedia.get(row.video_path) : null) ?? row.video_url;
    return [
      {
        id: row.id,
        author: {
          id: profile.id,
          username: profile.username,
          displayName: profile.display_name,
          avatarKey: profile.avatar_url ?? "",
          verified: profile.verified,
        },
        mediaUrl: videoUrl ?? imageUrl ?? "",
        mediaType: videoUrl ? "video" : imageUrl ? "image" : "text",
        caption: row.caption,
        background: row.story_background ?? "#111827",
        overlays: row.story_overlays ?? [],
        createdAt: row.created_at,
        expiresAt: row.story_expires_at,
        viewed: false,
        real: true,
      } satisfies StoryItem,
    ];
  });
}

export async function getStoryRail(
  userId: string,
  viewerClient?: SupabaseClient | null,
): Promise<StoryItem[]> {
  const load = async (): Promise<StoryItem[]> => {
    const real = await fetchRealStories(viewerClient).catch(() => []);
    const seed = [...stories]
      .sort((a, b) => Number(a.viewed) - Number(b.viewed) || b.createdAt.localeCompare(a.createdAt))
      .map((story): StoryItem => ({
        id: story.id,
        author: toAuthor(story.authorId),
        mediaUrl: imageUrl(story.media.objectKey, "thumbnail"),
        mediaType: "image",
        caption: "",
        background: "#111827",
        overlays: [],
        createdAt: story.createdAt,
        expiresAt: null,
        viewed: story.viewed,
        real: false,
      }));
    return [...real, ...seed];
  };

  return userId === CURRENT_USER_ID
    ? cacheAside(cacheKeys.stories(userId), TTL.feed, load)
    : load();
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
  const current = await supabase
    .from("posts")
    .select("hashtags, created_at")
    .eq("status", "published")
    .eq("visibility", "public")
    .eq("content_kind", "post")
    .gte("created_at", since)
    .limit(1000);
  if (current.error && !isMissingSchemaError(current.error)) return [];
  const compatible = current.error
    ? await supabase
        .from("posts")
        .select("hashtags, created_at")
        .eq("status", "published")
        .eq("visibility", "public")
        .gte("created_at", since)
        .limit(1000)
    : current;
  if (compatible.error || !compatible.data) return [];
  const data = compatible.data;
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
  viewerId: string | null = null,
  viewerClient?: SupabaseClient | null,
): Promise<HomeFeed> {
  const userId = viewerId ?? CURRENT_USER_ID;
  const [storyRail, topics, feed] = await Promise.all([
    getStoryRail(userId, viewerClient),
    getTrending("global"),
    getFeedPage(userId, cursor, profile, viewerClient),
  ]);
  // Creator-shaped display chrome still uses the bundled demo identity. The
  // viewer's real UUID is only the RLS/cache identity above.
  const currentUser = byId.get(CURRENT_USER_ID)!;
  return { currentUser, stories: storyRail, trending: topics, feed };
}
