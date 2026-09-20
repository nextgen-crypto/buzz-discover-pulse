import { i as TSS_SERVER_FUNCTION } from "./createServerFn-CIHAFgYl.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/redisCache-CU2nht6L.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
/** Intentional TTLs — nothing is cached permanently. */
var TTL = {
	trending: 45,
	feed: 60,
	popular: 180,
	profile: 300,
	search: 120,
	news: 90,
	config: 86400
};
/** Canonical key builders. Keep every key namespaced and prefix-invalidatable. */
var cacheKeys = {
	feed: (userId, cursor) => `feed:user:${userId}:${cursor}`,
	feedAll: (userId) => `feed:user:${userId}:`,
	post: (postId) => `post:${postId}`,
	profile: (userId) => `profile:${userId}`,
	trending: (region) => `trending:${region}`,
	news: (category) => `news:${category}`,
	explore: (category, cursor) => `explore:${category}:${cursor}`,
	recommendations: (userId) => `recommendations:${userId}`,
	search: (query) => `search:${query}`
};
var InMemoryCache = class {
	store = /* @__PURE__ */ new Map();
	hits = 0;
	misses = 0;
	async get(key) {
		const entry = this.store.get(key);
		if (!entry || entry.expiresAt < Date.now()) {
			if (entry) this.store.delete(key);
			this.misses += 1;
			return null;
		}
		this.hits += 1;
		return entry.value;
	}
	async set(key, value, ttlSeconds) {
		this.store.set(key, {
			value,
			expiresAt: Date.now() + ttlSeconds * 1e3
		});
	}
	async del(key) {
		this.store.delete(key);
	}
	async delPrefix(prefix) {
		for (const key of this.store.keys()) if (key.startsWith(prefix)) this.store.delete(key);
	}
	async incrBy(key, amount) {
		const next = (await this.get(key) ?? 0) + amount;
		await this.set(key, next, TTL.popular);
		return next;
	}
};
var cache = new InMemoryCache();
/** Cache-aside read. Miss -> loader -> SETEX -> response. */
async function cacheAside(key, ttlSeconds, loader) {
	const cached = await cache.get(key);
	if (cached !== null) return cached;
	const fresh = await loader();
	await cache.set(key, fresh, ttlSeconds);
	return fresh;
}
//#endregion
export { createServerRpc as i, cacheAside as n, cacheKeys as r, TTL as t };
