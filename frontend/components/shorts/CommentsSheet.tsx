import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, SendHorizonal, X } from "lucide-react";
import { useSession } from "@/frontend/hooks/useSession";
import { cn } from "@/lib/utils";

interface Comment {
  id: string;
  user: string;
  text: string;
  time: string;
  likes: number;
}

const SEED_COMMENTS: Record<string, Comment[]> = {
  "s-1": [
    {
      id: "c11",
      user: "leo.wilder",
      text: "That drop at 0:12 lives in my head now",
      time: "2h",
      likes: 214,
    },
    { id: "c12", user: "maya.k", text: "Loop number 47 over here", time: "5h", likes: 96 },
    {
      id: "c13",
      user: "nina.co",
      text: "The mix is so clean?? tutorial please",
      time: "1d",
      likes: 41,
    },
  ],
  "s-2": [
    {
      id: "c21",
      user: "sam_films",
      text: "Tried this, actually works. My kitchen survived.",
      time: "1h",
      likes: 88,
    },
    { id: "c22", user: "you", text: "60 seconds is a lie but worth it", time: "3h", likes: 35 },
  ],
  "s-3": [
    { id: "c31", user: "maya.k", text: "Hour nineteen hits different", time: "4h", likes: 57 },
    { id: "c32", user: "riko", text: "Adding this drive to the list", time: "9h", likes: 22 },
  ],
  "s-4": [
    {
      id: "c41",
      user: "leo.wilder",
      text: "That sheet animation is butter",
      time: "2h",
      likes: 31,
    },
  ],
  "s-5": [
    { id: "c51", user: "nina.co", text: "One light supremacy", time: "6h", likes: 44 },
    { id: "c52", user: "june", text: "Saving this for my next shoot", time: "1d", likes: 18 },
  ],
};

const FALLBACK: Comment[] = [
  { id: "c01", user: "leo.wilder", text: "This is so good", time: "3h", likes: 26 },
  { id: "c02", user: "maya.k", text: "Instant save", time: "7h", likes: 14 },
];

function keyFor(shortId: string) {
  return `wizz:short-comments:${shortId}`;
}

function loadMine(shortId: string): Comment[] {
  try {
    return JSON.parse(localStorage.getItem(keyFor(shortId)) ?? "[]") as Comment[];
  } catch {
    return [];
  }
}

/**
 * Transparent comment overlay: dark scrim + frosted panel, white glyphs.
 */
export function CommentsSheet({
  open,
  onClose,
  shortId,
  baseCount,
  onCount,
}: {
  open: boolean;
  onClose: () => void;
  shortId: string;
  baseCount: number;
  onCount: (mine: number) => void;
}) {
  const { user, displayName } = useSession();
  const [mine, setMine] = useState<Comment[]>(() => loadMine(shortId));
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (open) setMine(loadMine(shortId));
  }, [open, shortId]);

  useEffect(() => {
    onCount(mine.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mine.length]);

  if (!open) return null;
  const all = [...mine, ...(SEED_COMMENTS[shortId] ?? FALLBACK)];

  function post() {
    const text = draft.trim();
    if (!text) return;
    const comment: Comment = {
      id: `m-${Date.now()}`,
      user: displayName ?? user?.email?.split("@")[0] ?? "you",
      text: text.slice(0, 280),
      time: "now",
      likes: 0,
    };
    const next = [comment, ...mine];
    setMine(next);
    try {
      localStorage.setItem(keyFor(shortId), JSON.stringify(next));
    } catch {
      // ignore
    }
    setDraft("");
  }

  return (
    <div
      className="fixed inset-0 z-50 mx-auto w-full max-w-3xl"
      role="dialog"
      aria-label="Comments"
    >
      <button
        aria-label="Close comments"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <div className="animate-sheet-in absolute inset-x-0 bottom-0 flex max-h-[72dvh] flex-col rounded-t-3xl border-t border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="mx-auto mt-2 h-1.5 w-12 shrink-0 rounded-full bg-white/25" />
        <div className="flex shrink-0 items-center justify-between px-4 py-2.5">
          <p className="text-sm font-bold text-white">{baseCount + mine.length} comments</p>
          <button
            aria-label="Close comments"
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-white/10"
          >
            <X className="size-4 text-white" />
          </button>
        </div>
        <ul className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-3">
          {all.map((c) => {
            const isLiked = liked.has(c.id);
            return (
              <li key={c.id} className="flex items-start gap-2.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/15 text-xs font-bold text-white">
                  {c.user.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white/80">
                    {c.user} <span className="font-medium text-white/50">· {c.time}</span>
                  </p>
                  <p className="mt-0.5 break-words text-sm leading-snug text-white">{c.text}</p>
                </div>
                <button
                  aria-label="Like comment"
                  onClick={() =>
                    setLiked((prev) => {
                      const next = new Set(prev);
                      if (next.has(c.id)) next.delete(c.id);
                      else next.add(c.id);
                      return next;
                    })
                  }
                  className="flex shrink-0 flex-col items-center gap-0.5"
                >
                  <Heart
                    className={cn("size-4", isLiked ? "fill-live text-live" : "text-white/70")}
                  />
                  <span className="text-[10px] font-semibold text-white/60">
                    {c.likes + (isLiked ? 1 : 0)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="shrink-0 border-t border-white/10 px-3 py-2.5">
          {user ? (
            <div className="flex items-center gap-2">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/15 text-xs font-bold text-white">
                {(displayName ?? "Y").slice(0, 1).toUpperCase()}
              </span>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") post();
                }}
                placeholder="Add a comment…"
                maxLength={280}
                aria-label="Add a comment"
                className="min-w-0 flex-1 rounded-full bg-white/10 px-4 py-2 text-sm text-white outline-none placeholder:text-white/50"
              />
              <button
                aria-label="Post comment"
                onClick={post}
                disabled={!draft.trim()}
                className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-black disabled:opacity-40"
              >
                <SendHorizonal className="size-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="block rounded-full bg-white py-2.5 text-center text-sm font-bold text-black"
            >
              Sign in to comment
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
