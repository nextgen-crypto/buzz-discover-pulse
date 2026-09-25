/**
 * Cache layer (Redis contract).
 *
 * Two backends behind one interface:
 *  - Upstash Redis (REST, no extra deps) when UPSTASH_REDIS_REST_URL +
 *    UPSTASH_REDIS_REST_TOKEN are set — shared across server instances.
 *  - In-process map otherwise, so the app runs with zero infra.
 *
 * Reads go cache-aside with intentional TTLs; writes never go through the
 * cache — publishers call the invalidate helpers instead (see
 * `invalidateHomeCache` in api/home.functions.ts).
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
  feed: (userId: string, cursor: string, profileKey = "neutral") =>
    `feed:user:${userId}:${profileKey}:${cursor}`,
  feedAll: (userId: string) => `feed:user:${userId}:`,
  feedAllUsers: "feed:user:",
  candidates: (viewerId: string) => `candidates:viewer:${viewerId}`,
  candidatesAll: "candidates:viewer:",
  post: (postId: string) => `post:${postId}`,
  profile: (userId: string) => `profile:${userId}`,
  stories: (viewerId: string) => `stories:viewer:${viewerId}`,
  storiesAll: "stories:viewer:",
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

/** Upstash Redis over plain fetch (REST pipeline). Zero new dependencies. */
class UpstashCache implements CacheClient {
  constructor(
    private url: string,
    private token: string,
  ) {}

  private async call<T>(...command: (string | number)[]): Promise<T> {
    const res = await fetch(`${this.url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" },
      body: JSON.stringify([command]),
    });
    if (!res.ok) throw new Error(`Upstash ${res.status}`);
    const json = (await res.json()) as { result?: T }[];
    return json[0]?.result as T;
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.call<string | null>("GET", key).catch(() => null);
    if (raw === null || raw === undefined) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await this.call("SET", key, JSON.stringify(value), "EX", ttlSeconds).catch(() => undefined);
  }

  async del(key: string): Promise<void> {
    await this.call("DEL", key).catch(() => undefined);
  }

  async delPrefix(prefix: string): Promise<void> {
    try {
      let cursor = "0";
      do {
        const out = await this.call<[string, string[]]>(
          "SCAN",
          cursor,
          "MATCH",
          `${prefix}*`,
          "COUNT",
          200,
        );
        cursor = out?.[0] ?? "0";
        const keys = out?.[1] ?? [];
        if (keys.length > 0) await this.call("DEL", ...keys);
      } while (cursor !== "0");
    } catch {
      // prefix invalidation is best-effort; TTLs still expire stale rows
    }
  }

  async incrBy(key: string, amount: number): Promise<number> {
    const next = await this.call<number>("INCRBY", key, amount).catch(() => NaN);
    if (Number.isFinite(next)) {
      await this.call("EXPIRE", key, TTL.popular).catch(() => undefined);
      return next;
    }
    return amount;
  }
}

const memory = new InMemoryCache();
let shared: CacheClient | null = null;
let backend: "memory" | "upstash" = "memory";

function client(): CacheClient {
  if (shared) return shared;
  const url = process.env["UPSTASH_REDIS_REST_URL"];
  const token = process.env["UPSTASH_REDIS_REST_TOKEN"];
  if (url && token) {
    backend = "upstash";
    shared = new UpstashCache(url, token);
  } else {
    shared = memory;
  }
  return shared;
}

/** Which backend is active — surfaced in Admin → System health. */
export function cacheBackend(): "memory" | "upstash" {
  client();
  return backend;
}

/** Hit/miss counters (memory backend only; Redis tracks its own). */
export function cacheStats(): {
  backend: "memory" | "upstash";
  hits: number | null;
  misses: number | null;
} {
  client();
  if (backend === "memory") return { backend, hits: memory.hits, misses: memory.misses };
  return { backend, hits: null, misses: null };
}

/** Cache-aside read. Miss -> loader -> SETEX -> response. */
export async function cacheAside<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> {
  const c = client();
  try {
    const cached = await c.get<T>(key);
    if (cached !== null) return cached;
  } catch {
    // cache failure must never break the request — fall through to loader
  }
  const fresh = await loader();
  try {
    await c.set(key, fresh, ttlSeconds);
  } catch {
    // ignore write failures
  }
  return fresh;
}

/** Targeted invalidation. Never flush the whole keyspace. */
export const invalidate = {
  post: (postId: string) => client().del(cacheKeys.post(postId)),
  profile: (userId: string) => client().del(cacheKeys.profile(userId)),
  stories: () => client().delPrefix(cacheKeys.storiesAll),
  feed: (userId: string) => client().delPrefix(cacheKeys.feedAll(userId)),
  feedAll: () => client().delPrefix(cacheKeys.feedAllUsers),
  candidates: () => client().delPrefix(cacheKeys.candidatesAll),
  trending: (region: string) => client().del(cacheKeys.trending(region)),
};
