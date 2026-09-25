import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface PostingCapabilities {
  settings: boolean;
  video: boolean;
  sharing: boolean;
  media: boolean;
  scheduling: boolean;
  stories: boolean;
  likes: boolean;
  saves: boolean;
  /** The posting-integrity migration (including notification triggers) is ready. */
  integrity: boolean;
  full: boolean;
}

/** Server-side schema probe keeps expected legacy fallbacks out of browser consoles. */
export const fetchPostingCapabilities = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<PostingCapabilities> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const supports = async (columns: string) => {
      const { error } = await supabaseAdmin.from("posts").select(columns).limit(1);
      return !error;
    };

    const [
      settings,
      video,
      sharing,
      mediaColumns,
      scheduledColumns,
      stories,
      likes,
      saves,
      scheduler,
    ] = await Promise.all([
      supports("visibility,comments_enabled"),
      supports("video_url"),
      supports("allow_sharing"),
      supports("image_path,video_path,thumbnail_path"),
      supports("status,scheduled_at"),
      supports("content_kind,story_expires_at,story_overlays,story_background"),
      supabaseAdmin
        .from("post_likes")
        .select("post_id")
        .limit(1)
        .then(({ error }) => !error)
        .catch(() => false),
      supabaseAdmin
        .from("saves")
        .select("post_id")
        .limit(1)
        .then(({ error }) => !error)
        .catch(() => false),
      (async () => {
        const { data, error } = await supabaseAdmin.rpc("posting_integrity_ready");
        return !error && data === true;
      })().catch(() => false),
    ]);
    const scheduling = scheduledColumns && scheduler;
    const media = mediaColumns && scheduler;
    return {
      settings,
      video,
      sharing,
      media,
      scheduling,
      stories,
      likes,
      saves,
      integrity: scheduler,
      full: sharing && media && scheduling && stories,
    };
  });

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/** Owner-authorized status mutation with positive post-mutation verification. */
export const setOwnedPostStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { postId?: string; status?: string } | undefined) => ({
    postId: data?.postId ?? "",
    status: data?.status ?? "",
  }))
  .handler(async ({ context, data }) => {
    const userId = (context as unknown as { userId: string }).userId;
    if (!isUuid(data.postId)) throw new Error("Post not found.");
    if (!["published", "archived", "deleted"].includes(data.status)) {
      throw new Error("Invalid post status.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const owner = await supabaseAdmin
      .from("posts")
      .select("author_id")
      .eq("id", data.postId)
      .maybeSingle();
    if (owner.error || owner.data?.author_id !== userId) throw new Error("Post not found.");

    let result = await supabaseAdmin
      .from("posts")
      .update({
        status: data.status,
        ...(data.status === "published" ? { scheduled_at: null } : {}),
      })
      .eq("id", data.postId)
      .eq("author_id", userId)
      .select("id,status")
      .maybeSingle();
    if (result.error && /column|schema/i.test(result.error.message)) {
      result = await supabaseAdmin
        .from("posts")
        .update({ status: data.status })
        .eq("id", data.postId)
        .eq("author_id", userId)
        .select("id,status")
        .maybeSingle();
    }
    if (result.error || result.data?.status !== data.status) {
      throw new Error("That didn't stick — refresh and retry.");
    }
    await supabaseAdmin.from("content_audit").insert({
      actor_id: userId,
      action: data.status === "published" ? "post_published" : `post_${data.status}`,
      ref_id: data.postId,
    });
    return { ok: true as const, status: data.status };
  });

/** Permanent owner deletion; the client removes media only after this succeeds. */
export const deleteOwnedPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { postId?: string } | undefined) => ({ postId: data?.postId ?? "" }))
  .handler(async ({ context, data }) => {
    const userId = (context as unknown as { userId: string }).userId;
    if (!isUuid(data.postId)) throw new Error("Post not found.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const owner = await supabaseAdmin
      .from("posts")
      .select("author_id")
      .eq("id", data.postId)
      .maybeSingle();
    if (owner.error || owner.data?.author_id !== userId) throw new Error("Post not found.");
    const deleted = await supabaseAdmin
      .from("posts")
      .delete()
      .eq("id", data.postId)
      .eq("author_id", userId)
      .select("id")
      .maybeSingle();
    if (deleted.error?.code === "23503") {
      throw new Error("This post is referenced elsewhere and can't be wiped. Archive it instead.");
    }
    if (deleted.error || !deleted.data) throw new Error("Delete failed — refresh and retry.");
    await supabaseAdmin.from("content_audit").insert({
      actor_id: userId,
      action: "post_deleted_permanent",
      ref_id: data.postId,
    });
    return { ok: true as const };
  });
