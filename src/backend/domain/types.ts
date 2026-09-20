/**
 * BUZZ domain model.
 * Mirrors the PostgreSQL schema in database/migrations. Media binaries never
 * live here — only object-storage keys plus derived-rendition metadata.
 */

export type Visibility = "public" | "followers" | "private";
export type ModerationStatus = "pending" | "approved" | "rejected";

export interface Creator {
  id: string;
  username: string;
  displayName: string;
  avatarKey: string;
  verified: boolean;
  bio: string;
  followers: number;
  following: number;
  posts: number;
}

export interface MediaImage {
  kind: "image";
  objectKey: string;
  width: number;
  height: number;
  blurColor: string;
  alt: string;
}

export interface MediaVideo {
  kind: "video";
  objectKey: string;
  posterKey: string;
  durationSeconds: number;
  width: number;
  height: number;
  alt: string;
}

export type Media = MediaImage | MediaVideo;

export type PostSource = "buzz" | "x" | "news";

export interface PostMetrics {
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  views: number;
}

export interface Post {
  id: string;
  authorId: string;
  source: PostSource;
  externalUrl?: string;
  sourceName?: string;
  caption: string;
  media: Media[];
  hashtags: string[];
  location?: string;
  category: string;
  metrics: PostMetrics;
  createdAt: string;
  visibility: Visibility;
  moderationStatus: ModerationStatus;
}

export interface Story {
  id: string;
  authorId: string;
  media: MediaImage;
  createdAt: string;
  viewed: boolean;
}

export interface TrendingTopic {
  id: string;
  label: string;
  kind: "hashtag" | "topic" | "location" | "event";
  category: string;
  postCount: number;
  /** Engagement growth over the trailing window, used by the ranker. */
  velocity: number;
  region: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  sourceName: string;
  category: string;
  url: string;
  imageKey: string;
  publishedAt: string;
  live: boolean;
}

export interface ShortVideo {
  id: string;
  authorId: string;
  caption: string;
  soundtrack: string;
  category: string;
  video: MediaVideo;
  metrics: PostMetrics;
}

export interface LongVideo {
  id: string;
  authorId: string;
  title: string;
  category: string;
  video: MediaVideo;
  views: number;
  publishedAt: string;
  progressSeconds?: number;
}

export interface BuzzNotification {
  id: string;
  kind: "like" | "comment" | "follow" | "mention" | "trending";
  actorId: string;
  body: string;
  createdAt: string;
  read: boolean;
}

/** Cursor page envelope used by every list endpoint. No OFFSET pagination. */
export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}
