import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { MyProfile } from "@/frontend/hooks/useMyProfile";
import {
  normalizePost,
  POST_SELECT_V1,
  POST_SELECT_VIDEO,
} from "@/frontend/hooks/useMyProfileData";
import type { ProfileStats } from "@/frontend/hooks/useMyProfileData";
import { writeErrorMessage } from "@/frontend/lib/writeError";
import { hydratePostMediaList } from "@/frontend/lib/postMedia";

export type PublicProfile = MyProfile;

/** A public profile row looked up by username. */
export function useProfileByUsername(username: string, viewerId: string | null = null) {
  return useQuery({
    queryKey: ["profile-by-username", viewerId ?? "anonymous", username],
    staleTime: 30_000,
    queryFn: async (): Promise<PublicProfile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, bio, avatar_url, verified, is_private")
        .ilike("username", username)
        .maybeSingle();
      if (error) throw error;
      return (data as PublicProfile | null) ?? null;
    },
  });
}

/** Posts authored by any profile. */
export function useProfilePosts(profileId: string | null, viewerId: string | null = null) {
  return useQuery({
    queryKey: ["profile-posts", viewerId ?? "anonymous", profileId],
    enabled: Boolean(profileId),
    staleTime: 30_000,
    queryFn: async () => {
      if (!profileId) return [];
      const current = await supabase
        .from("posts")
        .select(
          "id, caption, image_url, image_path, created_at, hashtags, category, visibility, status, is_edited, comments_enabled, comments_count, is_pinned, thumbnail_url, thumbnail_path, video_url, video_path, allow_downloads, allow_remix, allow_duet, allow_sharing, content_kind, scheduled_at, story_expires_at",
        )
        .eq("author_id", profileId)
        .eq("status", "published")
        .eq("content_kind", "post")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });
      if (!current.error) {
        return hydratePostMediaList(
          ((current.data ?? []) as Record<string, unknown>[]).map(normalizePost),
        );
      }

      const compatible = await supabase
        .from("posts")
        .select(POST_SELECT_V1)
        .eq("author_id", profileId)
        .eq("status", "published")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });
      if (!compatible.error) {
        return hydratePostMediaList(
          ((compatible.data ?? []) as Record<string, unknown>[]).map(normalizePost),
        );
      }

      const video = await supabase
        .from("posts")
        .select(POST_SELECT_VIDEO)
        .eq("author_id", profileId)
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (!video.error) {
        return hydratePostMediaList(
          ((video.data ?? []) as Record<string, unknown>[]).map(normalizePost),
        );
      }

      const legacy = await supabase
        .from("posts")
        .select("id, caption, image_url, created_at, hashtags, category, visibility, status")
        .eq("author_id", profileId)
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (legacy.error) throw legacy.error;
      return hydratePostMediaList(
        ((legacy.data ?? []) as Record<string, unknown>[]).map(normalizePost),
      );
    },
  });
}

async function countPublicPosts(profileId: string): Promise<number> {
  const current = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("author_id", profileId)
    .eq("status", "published")
    .eq("content_kind", "post");
  if (!current.error) return current.count ?? 0;
  const legacy = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("author_id", profileId)
    .eq("status", "published");
  return legacy.count ?? 0;
}

/** Post / follower / following counts for any profile. */
export function useProfileStats(profileId: string | null, viewerId: string | null = null) {
  return useQuery({
    queryKey: ["profile-stats", viewerId ?? "anonymous", profileId],
    enabled: Boolean(profileId),
    staleTime: 30_000,
    queryFn: async (): Promise<ProfileStats> => {
      if (!profileId) return { posts: 0, followers: 0, following: 0 };
      const [posts, followers, following] = await Promise.all([
        countPublicPosts(profileId),
        supabase
          .from("follows")
          .select("follower_id", { count: "exact", head: true })
          .eq("followee_id", profileId),
        supabase
          .from("follows")
          .select("followee_id", { count: "exact", head: true })
          .eq("follower_id", profileId),
      ]);
      return {
        posts,
        followers: followers.count ?? 0,
        following: following.count ?? 0,
      };
    },
  });
}

/** Whether the signed-in user follows this profile, plus a follow/unfollow action. */
export function useFollowState(viewerId: string | null, profileId: string | null) {
  const queryClient = useQueryClient();
  const enabled = Boolean(viewerId && profileId && viewerId !== profileId);

  const query = useQuery({
    queryKey: ["follow-state", viewerId, profileId],
    enabled,
    staleTime: 10_000,
    queryFn: async (): Promise<boolean> => {
      if (!viewerId || !profileId) return false;
      const { data, error } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", viewerId)
        .eq("followee_id", profileId)
        .maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },
  });

  const mutation = useMutation({
    mutationFn: async (next: boolean) => {
      if (!viewerId || !profileId) throw new Error("Sign in to follow people.");
      if (next) {
        const { error } = await supabase
          .from("follows")
          .insert({ follower_id: viewerId, followee_id: profileId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", viewerId)
          .eq("followee_id", profileId);
        if (error) throw error;
      }
      return next;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["follow-state", viewerId, profileId] });
      void queryClient.invalidateQueries({ queryKey: ["profile-stats"] });
      void queryClient.invalidateQueries({ queryKey: ["my-stats"] });
      void queryClient.invalidateQueries({ queryKey: ["follow-list"] });
      void queryClient.invalidateQueries({ queryKey: ["profile-posts"] });
      void queryClient.invalidateQueries({ queryKey: ["profile-by-username"] });
    },
    onError: (e) => {
      toast.error(writeErrorMessage(e, "Could not follow. Try again."));
    },
  });

  return { isFollowing: query.data ?? false, canFollow: enabled, toggle: mutation };
}

export type FollowListKind = "followers" | "following";

/** Real accounts that follow, or are followed by, a profile. */
export function useFollowList(
  profileId: string | null,
  kind: FollowListKind,
  viewerId: string | null = null,
) {
  return useQuery({
    queryKey: ["follow-list", viewerId ?? "anonymous", profileId, kind],
    enabled: Boolean(profileId),
    staleTime: 30_000,
    queryFn: async (): Promise<PublicProfile[]> => {
      if (!profileId) return [];
      const matchColumn = kind === "followers" ? "followee_id" : "follower_id";
      const otherColumn = kind === "followers" ? "follower_id" : "followee_id";
      const { data: rows, error } = await supabase
        .from("follows")
        .select(`${otherColumn}`)
        .eq(matchColumn, profileId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const ids = (rows ?? [])
        .map((r) => (r as Record<string, string>)[otherColumn])
        .filter(Boolean);
      if (ids.length === 0) return [];
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, display_name, bio, avatar_url, verified, is_private")
        .in("id", ids as string[]);
      if (profileError) throw profileError;
      return (profiles ?? []) as PublicProfile[];
    },
  });
}
