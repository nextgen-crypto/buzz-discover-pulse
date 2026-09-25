import { useCallback, useEffect, useMemo, useState } from "react";
import type { InterestProfile } from "@/backend/services/feedService";
import type { SavedPost } from "@/frontend/hooks/useSavedPosts";

const KEY_PREFIX = {
  muted: "wizz:muted-authors",
  mutedNames: "wizz:muted-names",
  hidden: "wizz:hidden-posts",
  notInterested: "wizz:not-interested",
  watched: "wizz:watch-history",
} as const;

function scopedKey(prefix: string, userId: string | null): string {
  return `${prefix}:${userId ?? "anonymous"}`;
}

function loadIds(key: string): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(key) ?? "[]") as unknown;
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function saveIds(key: string, ids: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(ids.slice(0, 200)));
  } catch {
    // ignore unavailable storage
  }
}

type WatchMap = InterestProfile["watched"];

function loadNames(key: string): Record<string, string> {
  try {
    const raw = JSON.parse(localStorage.getItem(key) ?? "{}") as unknown;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    return Object.fromEntries(
      Object.entries(raw as Record<string, unknown>)
        .filter((entry): entry is [string, string] => typeof entry[1] === "string")
        .slice(0, 200),
    );
  } catch {
    return {};
  }
}

function saveNames(key: string, names: Record<string, string>) {
  try {
    localStorage.setItem(key, JSON.stringify(names));
  } catch {
    // ignore unavailable storage
  }
}

function loadWatched(key: string): WatchMap {
  try {
    const raw = JSON.parse(localStorage.getItem(key) ?? "{}") as unknown;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    const out: WatchMap = {};
    for (const [k, v] of Object.entries(raw as Record<string, unknown>).slice(0, 100)) {
      const w = v as { plays?: unknown; completed?: unknown } | null;
      if (w && typeof w === "object") {
        out[k] = {
          plays: typeof w.plays === "number" ? Math.min(Math.max(0, Math.floor(w.plays)), 99) : 0,
          completed: w.completed === true,
        };
      }
    }
    return out;
  } catch {
    return {};
  }
}

/**
 * Viewer-side taste: mutes, hides, not-interested flags and video watch
 * history. State is namespaced per account so a shared browser cannot carry
 * one user's personalization into another account.
 */
export function useFeedPrefs(userId: string | null = null) {
  const keys = useMemo(
    () => ({
      muted: scopedKey(KEY_PREFIX.muted, userId),
      mutedNames: scopedKey(KEY_PREFIX.mutedNames, userId),
      hidden: scopedKey(KEY_PREFIX.hidden, userId),
      notInterested: scopedKey(KEY_PREFIX.notInterested, userId),
      watched: scopedKey(KEY_PREFIX.watched, userId),
    }),
    [userId],
  );
  const [muted, setMuted] = useState<string[]>(() => loadIds(keys.muted));
  const [mutedNames, setMutedNames] = useState<Record<string, string>>(() =>
    loadNames(keys.mutedNames),
  );
  const [hidden, setHidden] = useState<string[]>(() => loadIds(keys.hidden));
  const [notInterested, setNotInterested] = useState<string[]>(() => loadIds(keys.notInterested));
  const [watched, setWatched] = useState<WatchMap>(() => loadWatched(keys.watched));
  const [, setTick] = useState(0);

  useEffect(() => {
    setMuted(loadIds(keys.muted));
    setMutedNames(loadNames(keys.mutedNames));
    setHidden(loadIds(keys.hidden));
    setNotInterested(loadIds(keys.notInterested));
    setWatched(loadWatched(keys.watched));
  }, [keys]);

  const refresh = useCallback(() => setTick((n) => n + 1), []);

  const muteAuthor = useCallback(
    (authorId: string, username?: string) => {
      setMuted((prev) => {
        const next = [...new Set([...prev, authorId])];
        saveIds(keys.muted, next);
        return next;
      });
      if (username) {
        setMutedNames((prev) => {
          const next = { ...prev, [authorId]: username };
          saveNames(keys.mutedNames, next);
          return next;
        });
      }
      refresh();
    },
    [keys, refresh],
  );

  const unmuteAuthor = useCallback(
    (authorId: string) => {
      setMuted((prev) => {
        const next = prev.filter((id) => id !== authorId);
        saveIds(keys.muted, next);
        return next;
      });
      setMutedNames((prev) => {
        const next = { ...prev };
        delete next[authorId];
        saveNames(keys.mutedNames, next);
        return next;
      });
      refresh();
    },
    [keys, refresh],
  );

  const hidePost = useCallback(
    (postId: string) => {
      setHidden((prev) => {
        const next = [...new Set([...prev, postId])];
        saveIds(keys.hidden, next);
        return next;
      });
      refresh();
    },
    [keys, refresh],
  );

  const markNotInterested = useCallback(
    (postId: string) => {
      setNotInterested((prev) => {
        const next = [...new Set([...prev, postId])];
        saveIds(keys.notInterested, next);
        return next;
      });
      refresh();
    },
    [keys, refresh],
  );

  const recordWatch = useCallback(
    (postId: string, completed: boolean) => {
      setWatched((prev) => {
        const cur = prev[postId] ?? { plays: 0, completed: false };
        const next: WatchMap = {
          ...prev,
          [postId]: { plays: Math.min(cur.plays + 1, 99), completed: cur.completed || completed },
        };
        try {
          localStorage.setItem(keys.watched, JSON.stringify(next));
        } catch {
          // ignore unavailable storage
        }
        return next;
      });
    },
    [keys],
  );

  return {
    muted,
    mutedNames,
    hidden,
    notInterested,
    watched,
    muteAuthor,
    unmuteAuthor,
    hidePost,
    markNotInterested,
    recordWatch,
  };
}

/** Pure builder: follows + saves + local taste → ranker input. */
export function buildInterestProfile(args: {
  followingIds: string[];
  savedPosts: SavedPost[];
  muted: string[];
  hidden: string[];
  notInterested: string[];
  watched: WatchMap;
}): InterestProfile {
  const savedCategories = [...new Set(args.savedPosts.map((p) => p.category).filter(Boolean))];
  const savedTags = [
    ...new Set(args.savedPosts.flatMap((p) => p.hashtags ?? []).map((t) => t.toLowerCase())),
  ];
  return {
    followingIds: args.followingIds,
    savedCategories,
    savedTags,
    mutedAuthorIds: args.muted,
    hiddenPostIds: args.hidden,
    notInterestedPostIds: args.notInterested,
    watched: args.watched,
  };
}
