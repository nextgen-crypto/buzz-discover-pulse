import { t as supabase } from "./client-BGCApjy7.mjs";
import { i as useQuery, o as useQueryClient, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/usePublicProfile-DCFLa5Jx.js
/** A public profile row looked up by username. */
function useProfileByUsername(username) {
	return useQuery({
		queryKey: ["profile-by-username", username],
		staleTime: 3e4,
		queryFn: async () => {
			const { data, error } = await supabase.from("profiles").select("id, username, display_name, bio, avatar_url, verified").ilike("username", username).maybeSingle();
			if (error) throw error;
			return data ?? null;
		}
	});
}
/** Posts authored by any profile. */
function useProfilePosts(profileId) {
	return useQuery({
		queryKey: ["profile-posts", profileId],
		enabled: Boolean(profileId),
		staleTime: 3e4,
		queryFn: async () => {
			if (!profileId) return [];
			const { data, error } = await supabase.from("posts").select("id, caption, image_url, created_at").eq("author_id", profileId).order("created_at", { ascending: false });
			if (error) throw error;
			return data ?? [];
		}
	});
}
/** Post / follower / following counts for any profile. */
function useProfileStats(profileId) {
	return useQuery({
		queryKey: ["profile-stats", profileId],
		enabled: Boolean(profileId),
		staleTime: 3e4,
		queryFn: async () => {
			if (!profileId) return {
				posts: 0,
				followers: 0,
				following: 0
			};
			const [posts, followers, following] = await Promise.all([
				supabase.from("posts").select("id", {
					count: "exact",
					head: true
				}).eq("author_id", profileId),
				supabase.from("follows").select("follower_id", {
					count: "exact",
					head: true
				}).eq("followee_id", profileId),
				supabase.from("follows").select("followee_id", {
					count: "exact",
					head: true
				}).eq("follower_id", profileId)
			]);
			return {
				posts: posts.count ?? 0,
				followers: followers.count ?? 0,
				following: following.count ?? 0
			};
		}
	});
}
/** Whether the signed-in user follows this profile, plus a follow/unfollow action. */
function useFollowState(viewerId, profileId) {
	const queryClient = useQueryClient();
	const enabled = Boolean(viewerId && profileId && viewerId !== profileId);
	const query = useQuery({
		queryKey: [
			"follow-state",
			viewerId,
			profileId
		],
		enabled,
		staleTime: 1e4,
		queryFn: async () => {
			if (!viewerId || !profileId) return false;
			const { data, error } = await supabase.from("follows").select("follower_id").eq("follower_id", viewerId).eq("followee_id", profileId).maybeSingle();
			if (error) throw error;
			return Boolean(data);
		}
	});
	const mutation = useMutation({
		mutationFn: async (next) => {
			if (!viewerId || !profileId) throw new Error("Sign in to follow people.");
			if (next) {
				const { error } = await supabase.from("follows").insert({
					follower_id: viewerId,
					followee_id: profileId
				});
				if (error) throw error;
			} else {
				const { error } = await supabase.from("follows").delete().eq("follower_id", viewerId).eq("followee_id", profileId);
				if (error) throw error;
			}
			return next;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [
				"follow-state",
				viewerId,
				profileId
			] });
			queryClient.invalidateQueries({ queryKey: ["profile-stats"] });
			queryClient.invalidateQueries({ queryKey: ["my-stats"] });
			queryClient.invalidateQueries({ queryKey: ["follow-list"] });
		}
	});
	return {
		isFollowing: query.data ?? false,
		canFollow: enabled,
		toggle: mutation
	};
}
/** Real accounts that follow, or are followed by, a profile. */
function useFollowList(profileId, kind) {
	return useQuery({
		queryKey: [
			"follow-list",
			profileId,
			kind
		],
		enabled: Boolean(profileId),
		staleTime: 3e4,
		queryFn: async () => {
			if (!profileId) return [];
			const matchColumn = kind === "followers" ? "followee_id" : "follower_id";
			const otherColumn = kind === "followers" ? "follower_id" : "followee_id";
			const { data: rows, error } = await supabase.from("follows").select(`${otherColumn}`).eq(matchColumn, profileId).order("created_at", { ascending: false });
			if (error) throw error;
			const ids = (rows ?? []).map((r) => r[otherColumn]).filter(Boolean);
			if (ids.length === 0) return [];
			const { data: profiles, error: profileError } = await supabase.from("profiles").select("id, username, display_name, bio, avatar_url, verified").in("id", ids);
			if (profileError) throw profileError;
			return profiles ?? [];
		}
	});
}
//#endregion
export { useProfileStats as a, useProfilePosts as i, useFollowState as n, useProfileByUsername as r, useFollowList as t };
