/**
 * Home-screen read services.
 *
 * Every read goes through the cache-aside helper with an intentional TTL and
 * returns cursor pages — no OFFSET pagination anywhere.
 */
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

const PAGE_SIZE = 6;

const byId = new Map(creators.map((c) => [c.id, c]));

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

/** Engagement-weighted recency ranking; deterministic so SSR and client agree. */
function rank(post: Post): number {
  const ageHours = (Date.parse("2026-08-27T12:00:00.000Z") - Date.parse(post.createdAt)) / 3_600_000;
  const engagement =
    post.metrics.likes + post.metrics.comments * 4 + post.metrics.saves * 3 + post.metrics.shares * 5;
  return engagement / Math.pow(ageHours + 2, 1.35);
}

function rankedPosts(): Post[] {
  return [...posts, ...externalPosts]
    .filter((p) => p.visibility === "public" && p.moderationStatus === "approved")
    .sort((a, b) => rank(b) - rank(a));
}

export async function getFeedPage(
  userId: string,
  cursor: string | null,
): Promise<CursorPage<FeedItem>> {
  return cacheAside(cacheKeys.feed(userId, cursor ?? "start"), TTL.feed, async () => {
    const all = rankedPosts();
    const startIndex = cursor ? all.findIndex((p) => p.id === cursor) + 1 : 0;
    const slice = all.slice(startIndex, startIndex + PAGE_SIZE);
    const items: FeedItem[] = slice.map((post, i) => {
      const clip = shorts[i % shorts.length];
      const attachVideo = post.media.length === 0 || i % 3 === 2;
      return {
        post,
        author: toAuthor(post.authorId),
        ...(attachVideo && clip ? { clipObjectKey: clip.video.objectKey } : {}),
      };
    });
    const last = slice[slice.length - 1];
    const hasMore = startIndex + slice.length < all.length;
    return { items, nextCursor: hasMore && last ? last.id : null, hasMore };
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
  return cacheAside(cacheKeys.trending(region), TTL.trending, async () =>
    [...trending].sort((a, b) => b.velocity - a.velocity).slice(0, 8),
  );
}

export async function getHomeFeed(cursor: string | null): Promise<HomeFeed> {
  const userId = CURRENT_USER_ID;
  const [storyRail, topics, feed] = await Promise.all([
    getStoryRail(userId),
    getTrending("global"),
    getFeedPage(userId, cursor),
  ]);
  const currentUser = byId.get(userId)!;
  return { currentUser, stories: storyRail, trending: topics, feed };
}
