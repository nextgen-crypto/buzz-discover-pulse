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
  /** Optional controls persisted for real database posts. */
  commentsEnabled?: boolean;
  allowSharing?: boolean;
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

export interface NewsUpdate {
  time: string;
  text: string;
  source: string;
}

export interface CoverageSource {
  name: string;
  headline: string;
  summary: string;
  time: string;
}

export type NewsContentType = "breaking" | "reporting" | "analysis" | "opinion";

export interface NewsArticle {
  id: string;
  title: string;
  subheadline: string;
  summary: string;
  body: string[];
  pullQuote?: string;
  sourceName: string;
  sourceHandle: string;
  reporter: string;
  category: string;
  url: string;
  imageKey: string;
  imageCredit: string;
  publishedAt: string;
  updatedAt: string;
  live: boolean;
  location: string;
  tags: string[];
  readMinutes: number;
  contentType: NewsContentType;
  updates: NewsUpdate[];
  coverage: CoverageSource[];
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
  description: string;
  category: string;
  tags: string[];
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
