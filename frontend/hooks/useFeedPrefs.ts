import { useCallback, useState } from "react";
import type { InterestProfile } from "@/backend/services/feedService";
import type { SavedPost } from "@/frontend/hooks/useSavedPosts";

const KEYS = {
  muted: "wizz:muted-authors",
  mutedNames: "wizz:muted-names",
  hidden: "wizz:hidden-posts",
  notInterested: "wizz:not-interested",
  watched: "wizz:watch-history",
} as const;

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
    // ignore
  }
}

type WatchMap = InterestProfile["watched"];

function loadWatched(): WatchMap {
  try {
    const raw = JSON.parse(localStorage.getItem(KEYS.watched) ?? "{}") as unknown;
    if (!raw || typeof raw !== "object") return {};
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
 * history. Everything here becomes NegativeSignals + watchQuality input
 * for the ranker — the feed learns what you skip, not just what you tap.
 */
export function useFeedPrefs() {
  const [muted, setMuted] = useState<string[]>(() => loadIds(KEYS.muted));
  const [mutedNames, setMutedNames] = useState<Record<string, string>>(() => {
    try {
      return (JSON.parse(localStorage.getItem(KEYS.mutedNames) ?? "{}") ?? {}) as Record<
        string,
        string
      >;
    } catch {
      return {};
    }
  });
  const [hidden, setHidden] = useState<string[]>(() => loadIds(KEYS.hidden));
  const [notInterested, setNotInterested] = useState<string[]>(() => loadIds(KEYS.notInterested));
  const [watched, setWatched] = useState<WatchMap>(loadWatched);
  const [, setTick] = useState(0);

  const refresh = useCallback(() => setTick((n) => n + 1), []);

  const muteAuthor = useCallback(
    (authorId: string, username?: string) => {
      setMuted((prev) => {
        const next = [...new Set([...prev, authorId])];
        saveIds(KEYS.muted, next);
        return next;
      });
      if (username) {
        setMutedNames((prev) => {
          const next = { ...prev, [authorId]: username };
          try {
            localStorage.setItem(KEYS.mutedNames, JSON.stringify(next));
          } catch {
            // ignore
          }
          return next;
        });
      }
      refresh();
    },
    [refresh],
  );

  const unmuteAuthor = useCallback(
    (authorId: string) => {
      setMuted((prev) => {
        const next = prev.filter((id) => id !== authorId);
        saveIds(KEYS.muted, next);
        return next;
      });
      setMutedNames((prev) => {
        const next = { ...prev };
        delete next[authorId];
        try {
          localStorage.setItem(KEYS.mutedNames, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
      refresh();
    },
    [refresh],
  );

  const hidePost = useCallback(
    (postId: string) => {
      setHidden((prev) => {
        const next = [...new Set([...prev, postId])];
        saveIds(KEYS.hidden, next);
        return next;
      });
      refresh();
    },
    [refresh],
  );

  const markNotInterested = useCallback(
    (postId: string) => {
      setNotInterested((prev) => {
        const next = [...new Set([...prev, postId])];
        saveIds(KEYS.notInterested, next);
        return next;
      });
      refresh();
    },
    [refresh],
  );

  const recordWatch = useCallback((postId: string, completed: boolean) => {
    setWatched((prev) => {
      const cur = prev[postId] ?? { plays: 0, completed: false };
      const next: WatchMap = {
        ...prev,
        [postId]: { plays: Math.min(cur.plays + 1, 99), completed: cur.completed || completed },
      };
      try {
        localStorage.setItem(KEYS.watched, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

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
