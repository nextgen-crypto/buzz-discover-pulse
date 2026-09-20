/**
 * Cache layer (Redis contract).
 *
 * The interface mirrors the Redis commands the production deployment uses
 * (GET / SETEX / DEL / SCAN-based prefix invalidation / INCRBY). The default
 * implementation is an in-process map so the app runs without a Redis node;
 * swapping in a real client only means implementing `CacheClient`.
 */

export interface CacheClient {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
  delPrefix(prefix: string): Promise<void>;
  incrBy(key: string, amount: number): Promise<number>;
}

/** Intentional TTLs — nothing is cached permanently. */
export const TTL = {
  trending: 45,
  feed: 60,
  popular: 180,
  profile: 300,
  search: 120,
  news: 90,
  config: 86_400,
} as const;

/** Canonical key builders. Keep every key namespaced and prefix-invalidatable. */
export const cacheKeys = {
  feed: (userId: string, cursor: string) => `feed:user:${userId}:${cursor}`,
  feedAll: (userId: string) => `feed:user:${userId}:`,
  post: (postId: string) => `post:${postId}`,
  profile: (userId: string) => `profile:${userId}`,
  trending: (region: string) => `trending:${region}`,
  news: (category: string) => `news:${category}`,
  explore: (category: string, cursor: string) => `explore:${category}:${cursor}`,
  recommendations: (userId: string) => `recommendations:${userId}`,
  search: (query: string) => `search:${query}`,
};

interface Entry {
  value: unknown;
  expiresAt: number;
}

class InMemoryCache implements CacheClient {
  private store = new Map<string, Entry>();
  hits = 0;
  misses = 0;

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry || entry.expiresAt < Date.now()) {
      if (entry) this.store.delete(key);
      this.misses += 1;
      return null;
    }
    this.hits += 1;
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async delPrefix(prefix: string): Promise<void> {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }

  async incrBy(key: string, amount: number): Promise<number> {
    const current = (await this.get<number>(key)) ?? 0;
    const next = current + amount;
    await this.set(key, next, TTL.popular);
    return next;
  }
}

export const cache: CacheClient = new InMemoryCache();

/** Cache-aside read. Miss -> loader -> SETEX -> response. */
export async function cacheAside<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> {
  const cached = await cache.get<T>(key);
  if (cached !== null) return cached;
  const fresh = await loader();
  await cache.set(key, fresh, ttlSeconds);
  return fresh;
}

/** Targeted invalidation. Never flush the whole keyspace. */
export const invalidate = {
  post: (postId: string) => cache.del(cacheKeys.post(postId)),
  profile: (userId: string) => cache.del(cacheKeys.profile(userId)),
  feed: (userId: string) => cache.delPrefix(cacheKeys.feedAll(userId)),
  trending: (region: string) => cache.del(cacheKeys.trending(region)),
};
