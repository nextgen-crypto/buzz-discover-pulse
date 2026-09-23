import { createServerFn } from "@tanstack/react-start";
import { CURRENT_USER_ID, creators, news, shorts, videos } from "../database/seed";
import { cacheAside, TTL } from "../cache/redisCache";
import type { LongVideo, NewsArticle, ShortVideo } from "../domain/types";

export interface ShortItem {
  short: ShortVideo;
  authorName: string;
  authorUsername: string;
  authorAvatarKey: string;
}

export interface VideoItem {
  video: LongVideo;
  authorName: string;
  authorUsername: string;
  authorAvatarKey: string;
  authorFollowers: number;
  authorVerified: boolean;
}

const byId = new Map(creators.map((c) => [c.id, c]));

export const fetchNews = createServerFn({ method: "GET" }).handler(async () =>
  cacheAside("news:latest", TTL.trending, async () =>
    [...news].sort(
      (a, b) => Number(b.live) - Number(a.live) || b.publishedAt.localeCompare(a.publishedAt),
    ),
  ),
);

/** Deterministic discussion volume so sorts are stable without a backend table. */
export function discussionCount(id: string): number {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return 120 + (h % 2400);
}

export const fetchArticle = createServerFn({ method: "GET" })
  .inputValidator((data: { articleId?: string } | undefined) => ({
    articleId: data?.articleId ?? "",
  }))
  .handler(async ({ data }): Promise<NewsArticle | null> => {
    if (!data.articleId) return null;
    return cacheAside(
      `news:article:${data.articleId}`,
      TTL.news,
      async () => news.find((a) => a.id === data.articleId) ?? null,
    );
  });

/** Related threads: category + tags + title affinity + live discussion. */
export const fetchRelatedNews = createServerFn({ method: "GET" })
  .inputValidator((data: { articleId?: string } | undefined) => ({
    articleId: data?.articleId ?? "",
  }))
  .handler(async ({ data }): Promise<NewsArticle[]> => {
    if (!data.articleId) return [];
    return cacheAside(`news:related:${data.articleId}`, TTL.news, async () => {
      const current = news.find((a) => a.id === data.articleId);
      if (!current) return [];
      const tags = new Set(current.tags.map((t) => t.toLowerCase()));
      const words = keywords(current.title);
      return news
        .filter((a) => a.id !== current.id)
        .map((a) => {
          let score = 0;
          if (a.category === current.category) score += 30;
          if (a.sourceName === current.sourceName) score += 10;
          score += Math.min(a.tags.filter((t) => tags.has(t.toLowerCase())).length * 12, 36);
          const w = keywords(a.title);
          let overlap = 0;
          for (const x of w) if (words.has(x)) overlap += 1;
          score += Math.min(overlap * 8, 24);
          score += Math.min(Math.log10(1 + discussionCount(a.id)) * 4, 16);
          return { a, score };
        })
        .sort((x, y) => y.score - x.score)
        .slice(0, 6)
        .map(({ a }) => a);
    });
  });

export interface NewsTopic {
  tag: string;
  articles: number;
  updates: number;
  discussions: number;
}

/** Transparent trending: most discussed, most recent velocity, fastest growing. */
export const fetchNewsTopics = createServerFn({ method: "GET" }).handler(
  async (): Promise<NewsTopic[]> =>
    cacheAside("news:topics", TTL.trending, async () => {
      const byTag = new Map<string, { articles: number; updates: number; discussions: number }>();
      for (const a of news) {
        for (const t of a.tags) {
          const key = t.toLowerCase();
          const row = byTag.get(key) ?? { articles: 0, updates: 0, discussions: 0 };
          row.articles += 1;
          row.updates += a.updates.length;
          row.discussions += discussionCount(a.id);
          byTag.set(key, row);
        }
      }
      return [...byTag.entries()]
        .map(([tag, v]) => ({ tag, ...v }))
        .sort((a, b) => b.discussions - a.discussions)
        .slice(0, 8);
    }),
);

export const fetchShorts = createServerFn({ method: "GET" }).handler(
  async (): Promise<ShortItem[]> =>
    cacheAside("shorts:rail", TTL.feed, async () =>
      shorts.map((short) => {
        const a = byId.get(short.authorId)!;
        return {
          short,
          authorName: a.displayName,
          authorUsername: a.username,
          authorAvatarKey: a.avatarKey,
        };
      }),
    ),
);

export const fetchVideos = createServerFn({ method: "GET" }).handler(
  async (): Promise<VideoItem[]> =>
    cacheAside("videos:list", TTL.feed, async () =>
      videos.map((video) => {
        const a = byId.get(video.authorId)!;
        return {
          video,
          authorName: a.displayName,
          authorUsername: a.username,
          authorAvatarKey: a.avatarKey,
          authorFollowers: a.followers,
          authorVerified: a.verified,
        };
      }),
    ),
);

function toVideoItem(video: LongVideo): VideoItem {
  const a = byId.get(video.authorId)!;
  return {
    video,
    authorName: a.displayName,
    authorUsername: a.username,
    authorAvatarKey: a.avatarKey,
    authorFollowers: a.followers,
    authorVerified: a.verified,
  };
}

export const fetchVideo = createServerFn({ method: "GET" })
  .inputValidator((data: { videoId?: string } | undefined) => ({ videoId: data?.videoId ?? "" }))
  .handler(async ({ data }): Promise<VideoItem | null> => {
    if (!data.videoId) return null;
    return cacheAside(`video:${data.videoId}`, TTL.feed, async () => {
      const video = videos.find((v) => v.id === data.videoId) ?? null;
      return video ? toVideoItem(video) : null;
    });
  });

const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "in",
  "on",
  "of",
  "to",
  "you",
  "your",
  "need",
  "with",
  "for",
]);

function keywords(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 3 && !STOPWORDS.has(w)),
  );
}

/**
 * Related-video ranker. Balanced so same-channel never auto-dominates:
 * channel and category weigh equally, tags/title/description add affinity,
 * log-views break ties, fresh uploads get a small lift.
 */
export const fetchRelated = createServerFn({ method: "GET" })
  .inputValidator((data: { videoId?: string } | undefined) => ({ videoId: data?.videoId ?? "" }))
  .handler(async ({ data }): Promise<VideoItem[]> => {
    if (!data.videoId) return [];
    return cacheAside(`related:${data.videoId}`, TTL.feed, async () => {
      const current = videos.find((v) => v.id === data.videoId);
      if (!current) return [];
      const currentTags = new Set(current.tags.map((t) => t.toLowerCase()));
      const currentTitle = keywords(current.title);
      const currentDesc = keywords(current.description);
      return videos
        .filter((v) => v.id !== current.id)
        .map((v) => {
          let score = 0;
          if (v.authorId === current.authorId) score += 20;
          if (v.category === current.category) score += 20;
          const sharedTags = v.tags.filter((t) => currentTags.has(t.toLowerCase())).length;
          score += Math.min(sharedTags * 15, 45);
          const words = keywords(v.title);
          let titleOverlap = 0;
          for (const w of words) if (currentTitle.has(w)) titleOverlap += 1;
          score += Math.min(titleOverlap * 15, 30);
          const descWords = keywords(v.description);
          let descOverlap = 0;
          for (const w of descWords) if (currentDesc.has(w)) descOverlap += 1;
          score += Math.min(descOverlap * 2, 10);
          const ageHours = roughAgeHours(v.publishedAt);
          if (ageHours !== null) score += ageHours <= 7 * 24 ? 5 : ageHours <= 30 * 24 ? 2 : 0;
          score += Math.min(Math.log10(1 + v.views) * 2, 14);
          return { video: v, score };
        })
        .sort((a, b) => b.score - a.score)
        .map(({ video }) => toVideoItem(video));
    });
  });

/** Rough parse of seed relative dates ("4 days ago", "1 week ago", ...). */
function roughAgeHours(publishedAt: string): number | null {
  const m = publishedAt.match(/(\d+)\s+(minute|hour|day|week|month)/i);
  if (!m) return null;
  const n = Number(m[1]);
  const unit = m[2]!.toLowerCase();
  const per: Record<string, number> = {
    minute: 1 / 60,
    hour: 1,
    day: 24,
    week: 24 * 7,
    month: 24 * 30,
  };
  return n * (per[unit] ?? 24);
}

export const fetchProfile = createServerFn({ method: "GET" }).handler(async () =>
  cacheAside(`profile:${CURRENT_USER_ID}`, TTL.profile, async () => ({
    user: byId.get(CURRENT_USER_ID)!,
    savedCount: 128,
    playlists: ["Watch Later", "Cooking ideas", "Travel inspo"],
  })),
);

export type { NewsArticle };
