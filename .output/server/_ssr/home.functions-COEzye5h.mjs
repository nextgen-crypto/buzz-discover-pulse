import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { i as createServerRpc, n as cacheAside, r as cacheKeys, t as TTL } from "./redisCache-CU2nht6L.mjs";
import { c as shorts, i as externalPosts, l as stories, n as creators, s as posts, t as CURRENT_USER_ID, u as trending } from "./seed-oF1kQ_Ut.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/home.functions-COEzye5h.js
/**
* Home-screen read services.
*
* Every read goes through the cache-aside helper with an intentional TTL and
* returns cursor pages — no OFFSET pagination anywhere.
*/
var PAGE_SIZE = 6;
var byId = new Map(creators.map((c) => [c.id, c]));
function toAuthor(id) {
	const c = byId.get(id);
	if (!c) throw new Error(`Unknown creator ${id}`);
	return {
		id: c.id,
		username: c.username,
		displayName: c.displayName,
		avatarKey: c.avatarKey,
		verified: c.verified
	};
}
/** Engagement-weighted recency ranking; deterministic so SSR and client agree. */
function rank(post) {
	const ageHours = (Date.parse("2026-08-27T12:00:00.000Z") - Date.parse(post.createdAt)) / 36e5;
	return (post.metrics.likes + post.metrics.comments * 4 + post.metrics.saves * 3 + post.metrics.shares * 5) / Math.pow(ageHours + 2, 1.35);
}
function rankedPosts() {
	return [...posts, ...externalPosts].filter((p) => p.visibility === "public" && p.moderationStatus === "approved").sort((a, b) => rank(b) - rank(a));
}
async function getFeedPage(userId, cursor) {
	return cacheAside(cacheKeys.feed(userId, cursor ?? "start"), TTL.feed, async () => {
		const all = rankedPosts();
		const startIndex = cursor ? all.findIndex((p) => p.id === cursor) + 1 : 0;
		const slice = all.slice(startIndex, startIndex + PAGE_SIZE);
		const items = slice.map((post, i) => {
			const clip = shorts[i % shorts.length];
			const attachVideo = post.media.length === 0 || i % 3 === 2;
			return {
				post,
				author: toAuthor(post.authorId),
				...attachVideo && clip ? { clipObjectKey: clip.video.objectKey } : {}
			};
		});
		const last = slice[slice.length - 1];
		const hasMore = startIndex + slice.length < all.length;
		return {
			items,
			nextCursor: hasMore && last ? last.id : null,
			hasMore
		};
	});
}
async function getStoryRail(userId) {
	return cacheAside(`stories:${userId}`, TTL.feed, async () => [...stories].sort((a, b) => Number(a.viewed) - Number(b.viewed) || b.createdAt.localeCompare(a.createdAt)).map((story) => ({
		story,
		author: toAuthor(story.authorId)
	})));
}
async function getTrending(region) {
	return cacheAside(cacheKeys.trending(region), TTL.trending, async () => [...trending].sort((a, b) => b.velocity - a.velocity).slice(0, 8));
}
async function getHomeFeed(cursor) {
	const userId = CURRENT_USER_ID;
	const [storyRail, topics, feed] = await Promise.all([
		getStoryRail(userId),
		getTrending("global"),
		getFeedPage(userId, cursor)
	]);
	return {
		currentUser: byId.get(userId),
		stories: storyRail,
		trending: topics,
		feed
	};
}
var fetchHome_createServerFn_handler = createServerRpc({
	id: "c767aa88534831a1cc729959885bd521c86e392cb4a5303b08cd8994d3719ba9",
	name: "fetchHome",
	filename: "src/backend/api/home.functions.ts"
}, (opts) => fetchHome.__executeServer(opts));
var fetchHome = createServerFn({ method: "GET" }).inputValidator((data) => ({ cursor: data?.cursor ?? null })).handler(fetchHome_createServerFn_handler, async ({ data }) => getHomeFeed(data.cursor));
var fetchFeedPage_createServerFn_handler = createServerRpc({
	id: "93d6630912eb37d4e10ac022dae571517a15b90d115c5d0fdac365ea0168e92d",
	name: "fetchFeedPage",
	filename: "src/backend/api/home.functions.ts"
}, (opts) => fetchFeedPage.__executeServer(opts));
var fetchFeedPage = createServerFn({ method: "GET" }).inputValidator((data) => ({ cursor: data?.cursor ?? null })).handler(fetchFeedPage_createServerFn_handler, async ({ data }) => getFeedPage(CURRENT_USER_ID, data.cursor));
//#endregion
export { fetchFeedPage_createServerFn_handler, fetchHome_createServerFn_handler };
