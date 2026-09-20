import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { MyProfile } from "@/frontend/hooks/useMyProfile";
import type { ProfilePost, ProfileStats } from "@/frontend/hooks/useMyProfileData";

export type PublicProfile = MyProfile;

/** A public profile row looked up by username. */
export function useProfileByUsername(username: string) {
  return useQuery({
    queryKey: ["profile-by-username", username],
    staleTime: 30_000,
    queryFn: async (): Promise<PublicProfile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, bio, avatar_url, verified")
        .ilike("username", username)
        .maybeSingle();
      if (error) throw error;
      return (data as PublicProfile | null) ?? null;
    },
  });
}

/** Posts authored by any profile. */
export function useProfilePosts(profileId: string | null) {
  return useQuery({
    queryKey: ["profile-posts", profileId],
    enabled: Boolean(profileId),
    staleTime: 30_000,
    queryFn: async (): Promise<ProfilePost[]> => {
      if (!profileId) return [];
      const { data, error } = await supabase
        .from("posts")
        .select("id, caption, image_url, created_at")
        .eq("author_id", profileId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ProfilePost[];
    },
  });
}

/** Post / follower / following counts for any profile. */
export function useProfileStats(profileId: string | null) {
  return useQuery({
    queryKey: ["profile-stats", profileId],
    enabled: Boolean(profileId),
    staleTime: 30_000,
    queryFn: async (): Promise<ProfileStats> => {
      if (!profileId) return { posts: 0, followers: 0, following: 0 };
      const [posts, followers, following] = await Promise.all([
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("author_id", profileId),
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
        posts: posts.count ?? 0,
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
    },
  });

  return { isFollowing: query.data ?? false, canFollow: enabled, toggle: mutation };
}

export type FollowListKind = "followers" | "following";

/** Real accounts that follow, or are followed by, a profile. */
export function useFollowList(profileId: string | null, kind: FollowListKind) {
  return useQuery({
    queryKey: ["follow-list", profileId, kind],
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
      const ids = (rows ?? []).map((r) => (r as Record<string, string>)[otherColumn]).filter(Boolean);
      if (ids.length === 0) return [];
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, display_name, bio, avatar_url, verified")
        .in("id", ids as string[]);
      if (profileError) throw profileError;
      return (profiles ?? []) as PublicProfile[];
    },
  });
}
