import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { hydratePostMediaList } from "@/frontend/lib/postMedia";

export type ProfilePost = {
  id: string;
  caption: string;
  image_url: string | null;
  image_path: string;
  created_at: string;
  hashtags: string[];
  category: string;
  visibility: string;
  status: string;
  is_edited: boolean;
  comments_enabled: boolean;
  comments_count: number;
  is_pinned: boolean;
  thumbnail_url: string | null;
  thumbnail_path: string;
  video_url: string | null;
  video_path: string;
  allow_downloads: boolean;
  allow_remix: boolean;
  allow_duet: boolean;
  allow_sharing: boolean;
  content_kind: string;
  scheduled_at: string | null;
  story_expires_at: string | null;
};

export type ProfileStats = {
  posts: number;
  followers: number;
  following: number;
};

const POST_SELECT_FULL =
  "id, caption, image_url, image_path, created_at, hashtags, category, visibility, status, is_edited, comments_enabled, comments_count, is_pinned, thumbnail_url, thumbnail_path, video_url, video_path, allow_downloads, allow_remix, allow_duet, allow_sharing, content_kind, scheduled_at, story_expires_at";
export const POST_SELECT_V1 =
  "id, caption, image_url, created_at, hashtags, category, visibility, status, is_edited, comments_enabled, comments_count, is_pinned, thumbnail_url, video_url, allow_downloads, allow_remix, allow_duet";
export const POST_SELECT_VIDEO =
  "id, caption, image_url, video_url, created_at, hashtags, category, visibility, status";
const POST_SELECT_LEGACY =
  "id, caption, image_url, created_at, hashtags, category, visibility, status, is_edited, comments_enabled, comments_count";

export function normalizePost(row: Record<string, unknown>): ProfilePost {
  return {
    id: row["id"] as string,
    caption: (row["caption"] as string) ?? "",
    image_url: (row["image_url"] as string | null) ?? null,
    image_path: (row["image_path"] as string | null) ?? "",
    created_at: row["created_at"] as string,
    hashtags: (row["hashtags"] as string[]) ?? [],
    category: (row["category"] as string) ?? "For You",
    visibility: (row["visibility"] as string) ?? "public",
    status: (row["status"] as string) ?? "published",
    is_edited: (row["is_edited"] as boolean) ?? false,
    comments_enabled: (row["comments_enabled"] as boolean) ?? true,
    comments_count: (row["comments_count"] as number) ?? 0,
    is_pinned: (row["is_pinned"] as boolean) ?? false,
    thumbnail_url: (row["thumbnail_url"] as string | null) ?? null,
    thumbnail_path: (row["thumbnail_path"] as string | null) ?? "",
    video_url: (row["video_url"] as string | null) ?? null,
    video_path: (row["video_path"] as string | null) ?? "",
    allow_downloads: (row["allow_downloads"] as boolean) ?? true,
    allow_remix: (row["allow_remix"] as boolean) ?? true,
    allow_duet: (row["allow_duet"] as boolean) ?? false,
    allow_sharing: (row["allow_sharing"] as boolean) ?? true,
    content_kind: (row["content_kind"] as string) ?? "post",
    scheduled_at: (row["scheduled_at"] as string | null) ?? null,
    story_expires_at: (row["story_expires_at"] as string | null) ?? null,
  };
}

/** Real posts authored by the signed-in user. Falls back through older
 *  column sets so the grid keeps working before part6/part7 SQL runs. */
export function useMyPosts(userId: string | null) {
  return useQuery({
    queryKey: ["my-posts", userId],
    enabled: Boolean(userId),
    staleTime: 30_000,
    queryFn: async (): Promise<ProfilePost[]> => {
      if (!userId) return [];
      for (const select of [
        POST_SELECT_FULL,
        POST_SELECT_V1,
        POST_SELECT_VIDEO,
        POST_SELECT_LEGACY,
      ]) {
        const { data, error } = await supabase
          .from("posts")
          .select(select)
          .eq("author_id", userId)
          .order("created_at", { ascending: false });
        if (!error) {
          return hydratePostMediaList(
            ((data ?? []) as unknown as Record<string, unknown>[]).map(normalizePost),
          );
        }
      }
      throw new Error("Could not load your posts.");
    },
  });
}

async function countOwnerPosts(userId: string): Promise<number> {
  const current = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("author_id", userId)
    .eq("status", "published")
    .eq("content_kind", "post");
  if (!current.error) return current.count ?? 0;
  const legacy = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("author_id", userId)
    .eq("status", "published");
  return legacy.count ?? 0;
}

/** Real post / follower / following counts for the signed-in user. */
export function useMyStats(userId: string | null) {
  return useQuery({
    queryKey: ["my-stats", userId],
    enabled: Boolean(userId),
    staleTime: 30_000,
    queryFn: async (): Promise<ProfileStats> => {
      if (!userId) return { posts: 0, followers: 0, following: 0 };
      const [posts, followers, following] = await Promise.all([
        countOwnerPosts(userId),
        supabase
          .from("follows")
          .select("follower_id", { count: "exact", head: true })
          .eq("followee_id", userId),
        supabase
          .from("follows")
          .select("followee_id", { count: "exact", head: true })
          .eq("follower_id", userId),
      ]);
      return {
        posts,
        followers: followers.count ?? 0,
        following: following.count ?? 0,
      };
    },
  });
}
