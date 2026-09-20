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
}

const byId = new Map(creators.map((c) => [c.id, c]));

export const fetchNews = createServerFn({ method: "GET" }).handler(async () =>
  cacheAside("news:latest", TTL.trending, async () =>
    [...news].sort((a, b) => Number(b.live) - Number(a.live) || b.publishedAt.localeCompare(a.publishedAt)),
  ),
);

export const fetchShorts = createServerFn({ method: "GET" }).handler(async (): Promise<ShortItem[]> =>
  cacheAside("shorts:rail", TTL.feed, async () =>
    shorts.map((short) => {
      const a = byId.get(short.authorId)!;
      return { short, authorName: a.displayName, authorUsername: a.username, authorAvatarKey: a.avatarKey };
    }),
  ),
);

export const fetchVideos = createServerFn({ method: "GET" }).handler(async (): Promise<VideoItem[]> =>
  cacheAside("videos:list", TTL.feed, async () =>
    videos.map((video) => {
      const a = byId.get(video.authorId)!;
      return { video, authorName: a.displayName, authorUsername: a.username, authorAvatarKey: a.avatarKey };
    }),
  ),
);

export const fetchProfile = createServerFn({ method: "GET" }).handler(async () =>
  cacheAside(`profile:${CURRENT_USER_ID}`, TTL.profile, async () => ({
    user: byId.get(CURRENT_USER_ID)!,
    savedCount: 128,
    playlists: ["Watch Later", "Cooking ideas", "Travel inspo"],
  })),
);

export type { NewsArticle };
