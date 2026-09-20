import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { i as createServerRpc, n as cacheAside, t as TTL } from "./redisCache-CU2nht6L.mjs";
import { a as news, c as shorts, d as videos, n as creators, t as CURRENT_USER_ID } from "./seed-oF1kQ_Ut.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/sections.functions-BJWJJ7vl.js
var byId = new Map(creators.map((c) => [c.id, c]));
var fetchNews_createServerFn_handler = createServerRpc({
	id: "8fd72aa0d978550cb13306f7880b2b59971960991a33c1bc535cfc03a0525b49",
	name: "fetchNews",
	filename: "src/backend/api/sections.functions.ts"
}, (opts) => fetchNews.__executeServer(opts));
var fetchNews = createServerFn({ method: "GET" }).handler(fetchNews_createServerFn_handler, async () => cacheAside("news:latest", TTL.trending, async () => [...news].sort((a, b) => Number(b.live) - Number(a.live) || b.publishedAt.localeCompare(a.publishedAt))));
var fetchShorts_createServerFn_handler = createServerRpc({
	id: "1555d3cfc853fc00376bf0ea8adfe839857732fdf24ca16aed5b8b1ada1659f2",
	name: "fetchShorts",
	filename: "src/backend/api/sections.functions.ts"
}, (opts) => fetchShorts.__executeServer(opts));
var fetchShorts = createServerFn({ method: "GET" }).handler(fetchShorts_createServerFn_handler, async () => cacheAside("shorts:rail", TTL.feed, async () => shorts.map((short) => {
	const a = byId.get(short.authorId);
	return {
		short,
		authorName: a.displayName,
		authorUsername: a.username,
		authorAvatarKey: a.avatarKey
	};
})));
var fetchVideos_createServerFn_handler = createServerRpc({
	id: "e227bd9c0a7746bad584dc96c5aeab809c9393205d7c99d261c99aed330fa863",
	name: "fetchVideos",
	filename: "src/backend/api/sections.functions.ts"
}, (opts) => fetchVideos.__executeServer(opts));
var fetchVideos = createServerFn({ method: "GET" }).handler(fetchVideos_createServerFn_handler, async () => cacheAside("videos:list", TTL.feed, async () => videos.map((video) => {
	const a = byId.get(video.authorId);
	return {
		video,
		authorName: a.displayName,
		authorUsername: a.username,
		authorAvatarKey: a.avatarKey
	};
})));
var fetchProfile_createServerFn_handler = createServerRpc({
	id: "03b44a115c63ff51e2eef3e2d2962cab6cbae93563e78b11bc15220a0dbf7915",
	name: "fetchProfile",
	filename: "src/backend/api/sections.functions.ts"
}, (opts) => fetchProfile.__executeServer(opts));
var fetchProfile = createServerFn({ method: "GET" }).handler(fetchProfile_createServerFn_handler, async () => cacheAside(`profile:${CURRENT_USER_ID}`, TTL.profile, async () => ({
	user: byId.get(CURRENT_USER_ID),
	savedCount: 128,
	playlists: [
		"Watch Later",
		"Cooking ideas",
		"Travel inspo"
	]
})));
//#endregion
export { fetchNews_createServerFn_handler, fetchProfile_createServerFn_handler, fetchShorts_createServerFn_handler, fetchVideos_createServerFn_handler };
