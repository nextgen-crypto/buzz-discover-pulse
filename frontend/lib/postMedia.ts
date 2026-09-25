import { supabase } from "@/integrations/supabase/client";
import { MEDIA_URL_TTL_SECONDS } from "@/frontend/lib/storageUpload";

export type PostMediaFields = {
  image_url: string | null;
  image_path?: string | null;
  video_url?: string | null;
  video_path?: string | null;
  thumbnail_url?: string | null;
  thumbnail_path?: string | null;
};

/** Replace canonical paths with viewer-authorized, five-minute media URLs. */
export async function hydratePostMediaList<T extends PostMediaFields>(posts: T[]): Promise<T[]> {
  const paths = [
    ...new Set(
      posts.flatMap((post) =>
        [post.image_path, post.video_path, post.thumbnail_path].filter((path): path is string =>
          Boolean(path),
        ),
      ),
    ),
  ];
  if (paths.length === 0) return posts;
  const result = await supabase.storage
    .from("post-images")
    .createSignedUrls(paths, MEDIA_URL_TTL_SECONDS);
  const signed = new Map(
    (result.data ?? []).flatMap((item) =>
      item.path && item.signedUrl && !item.error ? [[item.path, item.signedUrl] as const] : [],
    ),
  );
  return posts.map((post) => ({
    ...post,
    image_url: (post.image_path ? signed.get(post.image_path) : null) ?? post.image_url,
    video_url: (post.video_path ? signed.get(post.video_path) : null) ?? post.video_url,
    thumbnail_url:
      (post.thumbnail_path ? signed.get(post.thumbnail_path) : null) ?? post.thumbnail_url,
  }));
}
