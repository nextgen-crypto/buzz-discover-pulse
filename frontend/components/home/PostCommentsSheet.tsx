import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, SendHorizonal, Flag } from "lucide-react";
import { Sheet } from "@/frontend/components/overlays/Sheet";
import { cn } from "@/lib/utils";

export interface UiComment {
  id: string;
  user: string;
  text: string;
  time: string;
  likes: number;
  isLiked: boolean;
}

export interface PostComment {
  id: string;
  user: string;
  text: string;
  time: string;
  likes: number;
}

const POOL: PostComment[] = [
  { id: "p1", user: "maya.k", text: "This deserves way more views", time: "2h", likes: 48 },
  { id: "p2", user: "leo.wilder", text: "Instant save. No notes.", time: "4h", likes: 31 },
  { id: "p3", user: "nina.co", text: "The details here are unreal", time: "6h", likes: 22 },
  { id: "p4", user: "sam_films", text: "Watched this three times already", time: "8h", likes: 17 },
  { id: "p5", user: "june", text: "Okay this actually helped me a lot", time: "1d", likes: 12 },
  { id: "p6", user: "riko", text: "First. And worth it.", time: "1d", likes: 9 },
];

function keyFor(postId: string) {
  return `wizz:post-comments:${postId}`;
}

/** Local fallback for demo posts that have no Supabase row. */
export function loadPostComments(postId: string): PostComment[] {
  try {
    return JSON.parse(localStorage.getItem(keyFor(postId)) ?? "[]") as PostComment[];
  } catch {
    return [];
  }
}

export function savePostComments(postId: string, comments: PostComment[]) {
  try {
    localStorage.setItem(keyFor(postId), JSON.stringify(comments));
  } catch {
    // ignore
  }
}

/** Deterministic preview pick so every post shows a first comment like YouTube. */
export function topPostComment(postId: string): PostComment {
  let h = 0;
  for (const ch of postId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return POOL[h % POOL.length]!;
}

export function seedPostComments(postId: string): PostComment[] {
  const first = topPostComment(postId);
  const second = topPostComment(`${postId}:2`);
  return second.id === first.id ? [first] : [first, second];
}

export function PostCommentsSheet({
  open,
  onClose,
  total,
  comments,
  canPost,
  posterInitial,
  posting,
  postError,
  onPost,
  onToggleLike,
  onReportComment,
}: {
  open: boolean;
  onClose: () => void;
  total: number;
  comments: UiComment[];
  canPost: boolean;
  posterInitial: string;
  posting?: boolean;
  postError?: string | null;
  onPost: (text: string) => void;
  onToggleLike: (id: string) => void;
  onReportComment?: (c: UiComment) => void;
}) {
  const [draft, setDraft] = useState("");

  function post() {
    const text = draft.trim();
    if (!text) return;
    onPost(text);
    setDraft("");
  }

  return (
    <Sheet open={open} onClose={onClose} title={`Comments (${total})`}>
      <ul className="space-y-4 px-1 py-1">
        {comments.map((c) => (
          <li key={c.id} className="flex items-start gap-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-foreground">
              {c.user.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-muted-foreground">
                {c.user} <span className="font-medium">· {c.time}</span>
              </p>
              <p className="mt-0.5 break-words text-sm leading-snug text-foreground">{c.text}</p>
            </div>
            <div className="flex shrink-0 flex-col items-center gap-0.5">
              <button aria-label="Like comment" onClick={() => onToggleLike(c.id)}>
                <Heart
                  className={cn(
                    "size-4",
                    c.isLiked ? "fill-live text-live" : "text-muted-foreground",
                  )}
                />
              </button>
              <span className="text-[10px] font-semibold text-muted-foreground">
                {c.likes + (c.isLiked ? 1 : 0)}
              </span>
              {onReportComment && (
                <button
                  aria-label="Report comment"
                  onClick={() => onReportComment(c)}
                  className="mt-1"
                >
                  <Flag className="size-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
          </li>
        ))}
        {comments.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">Be the first to comment.</p>
        )}
      </ul>
      {postError && <p className="px-1 text-xs font-semibold text-live">{postError}</p>}
      <div className="border-t border-border px-1 py-3">
        {canPost ? (
          <div className="flex items-center gap-2">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-brand-foreground">
              {posterInitial.toUpperCase()}
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
              className="min-w-0 flex-1 rounded-full bg-secondary px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button
              aria-label="Post comment"
              onClick={post}
              disabled={!draft.trim() || posting}
              className="grid size-9 shrink-0 place-items-center rounded-full bg-brand text-brand-foreground disabled:opacity-40"
            >
              <SendHorizonal className="size-4" />
            </button>
          </div>
        ) : (
          <Link
            to="/auth"
            className="block rounded-full bg-brand py-2.5 text-center text-sm font-bold text-brand-foreground"
          >
            Sign in to comment
          </Link>
        )}
      </div>
    </Sheet>
  );
}
