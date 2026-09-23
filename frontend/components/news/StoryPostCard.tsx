import { useState } from "react";
import {
  BadgeCheck,
  Bookmark,
  Eye,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Repeat2,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import type { StoryPost } from "@/frontend/hooks/useStoryDetail";
import { usePostLikes } from "@/frontend/hooks/usePostLikes";
import { useSession } from "@/frontend/hooks/useSession";
import { useAuthGate } from "@/frontend/hooks/useAuthGate";
import { ReportDialog } from "@/frontend/components/moderation/ReportDialog";
import { formatCount, newsTimeAgo, replyingTo } from "@/frontend/components/news/newsFormat";
import { cn } from "@/lib/utils";

/**
 * One real post inside a story thread. Same visual language as the feed:
 * avatar, name, @handle, verified, time, 3-line body, media, compact
 * action row. Owner-only actions appear only for the author's own posts.
 */
export function StoryPostCard({
  post,
  onMuteAuthor,
  onHide,
}: {
  post: StoryPost;
  onMuteAuthor: (authorId: string, username: string) => void;
  onHide: (postId: string) => void;
}) {
  const { user } = useSession();
  const userId = user?.id ?? null;
  const requireAuth = useAuthGate();
  const like = usePostLikes(post.postId, userId);
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reposted, setReposted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [gone, setGone] = useState(false);
  const [viewing, setViewing] = useState(false);

  if (gone) return null;

  const author = post.author;
  const isOwner = userId !== null && author !== null && author.id === userId;
  const long = post.caption.length > 200;
  const text = expanded || !long ? post.caption : `${post.caption.slice(0, 200)}…`;
  const replyTo = replyingTo(post.caption);

  function copyLink() {
    try {
      void navigator.clipboard.writeText(`${window.location.origin}/news#${post.postId}`);
      toast("Link copied.");
    } catch {
      toast("Could not copy link.");
    }
  }

  function hide() {
    setGone(true);
    setMenuOpen(false);
    onHide(post.postId);
  }

  return (
    <article className="px-4 py-3">
      <div className="flex items-start gap-2.5">
        {author?.avatarUrl ? (
          <img
            src={author.avatarUrl}
            alt={author.displayName}
            loading="lazy"
            className="size-9 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-foreground">
            {(author?.displayName ?? "?").slice(0, 1).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="flex min-w-0 items-center gap-1 text-sm">
            <span className="truncate font-semibold text-foreground">
              {author?.displayName ?? "Someone"}
            </span>
            {author?.verified && <BadgeCheck className="size-4 shrink-0 text-brand" />}
            <span className="truncate font-medium text-muted-foreground">
              @{author?.username ?? "someone"} · {newsTimeAgo(post.createdAt)}
            </span>
          </p>
          <p className="mt-0.5 break-words text-[15px] leading-relaxed text-foreground">{text}</p>
          {replyTo && (
            <p className="mt-0.5 text-xs text-muted-foreground">Replying to @{replyTo}</p>
          )}
          {long && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-0.5 text-sm font-semibold text-muted-foreground"
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
        <span className="relative shrink-0">
          <button
            aria-label="Post options"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="-mr-1 rounded-full p-1 hover:bg-secondary"
          >
            <MoreHorizontal className="size-4 text-muted-foreground" />
          </button>
          {menuOpen && (
            <>
              <button
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
                className="fixed inset-0 z-10 cursor-default"
              />
              <div className="absolute right-0 top-8 z-20 w-48 overflow-hidden rounded-2xl border border-border bg-card shadow-raise">
                {[
                  { label: "Share", fn: copyLink },
                  { label: "Copy link", fn: copyLink },
                  {
                    label: saved ? "Unsave" : "Save",
                    fn: () => {
                      setSaved((v) => !v);
                      toast(saved ? "Removed from saved." : "Saved.");
                    },
                  },
                  { label: "Not interested", fn: hide },
                  { label: "Report", fn: () => setReporting(true) },
                  ...(author && !isOwner
                    ? [{ label: `Mute @${author.username}`, fn: () => onMuteAuthor(author.id, author.username) }]
                    : []),
                ].map(({ label, fn }) => (
                  <button
                    key={label}
                    onClick={() => {
                      setMenuOpen(false);
                      if (label.startsWith("Mute")) setGone(true);
                      fn();
                    }}
                    className="block w-full px-3 py-2.5 text-left text-sm font-medium hover:bg-secondary"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </span>
      </div>

      {post.imageUrl && (
        <button onClick={() => setViewing(true)} aria-label="Open image full screen" className="mt-2 block w-full">
          <img
            src={post.imageUrl}
            alt=""
            loading="lazy"
            className="max-h-96 w-full rounded-xl border border-border bg-surface-strong object-contain"
          />
        </button>
      )}
      {post.videoUrl && (
        <video
          src={post.videoUrl}
          controls
          playsInline
          preload="metadata"
          className="mt-2 max-h-96 w-full rounded-xl border border-border bg-surface-strong"
        />
      )}
      {viewing && post.imageUrl && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/95 p-4"
          role="dialog"
          aria-label="Image viewer"
          onClick={() => setViewing(false)}
        >
          <img src={post.imageUrl} alt="" className="max-h-full max-w-full rounded-2xl object-contain" />
        </div>
      )}

      <div className="mt-1.5 flex items-center gap-0.5">
        <span className="flex items-center gap-1.5 rounded-full px-2 py-1.5">
          <MessageCircle className="size-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground">
            {formatCount(post.commentsCount)}
          </span>
        </span>
        <button
          aria-label="Repost"
          aria-pressed={reposted}
          onClick={() => {
            if (!requireAuth()) return;
            setReposted((v) => !v);
          }}
          className="flex items-center gap-1.5 rounded-full px-2 py-1.5 hover:bg-secondary"
        >
          <Repeat2 className={cn("size-4", reposted ? "text-brand" : "text-muted-foreground")} />
          <span className="text-xs font-semibold text-muted-foreground">
            {formatCount(reposted ? 1 : 0)}
          </span>
        </button>
        <button
          aria-label="Like"
          aria-pressed={like.liked}
          onClick={() => {
            if (!requireAuth()) return;
            like.toggle(!like.liked);
          }}
          className="press flex items-center gap-1.5 rounded-full px-2 py-1.5 hover:bg-secondary"
        >
          <Heart className={cn("size-4", like.liked ? "fill-live text-live" : "text-muted-foreground")} />
          <span className="text-xs font-semibold text-muted-foreground">
            {formatCount(like.count)}
          </span>
        </button>
        <span className="flex items-center gap-1.5 rounded-full px-2 py-1.5">
          <Eye className="size-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground">
            {formatCount(post.views)}
          </span>
        </span>
        <button aria-label="Share" onClick={copyLink} className="rounded-full p-2 hover:bg-secondary">
          <Share2 className="size-4 text-muted-foreground" />
        </button>
        <span className="flex-1" />
        <button
          aria-label={saved ? "Unsave" : "Save"}
          aria-pressed={saved}
          onClick={() => setSaved((v) => !v)}
          className="rounded-full p-2 hover:bg-secondary"
        >
          <Bookmark className={cn("size-4", saved ? "fill-brand text-brand" : "text-muted-foreground")} />
        </button>
      </div>
      {reporting && (
        <ReportDialog
          open
          onClose={() => setReporting(false)}
          target={{
            kind: "post",
            refId: post.postId,
            refTitle: post.caption.slice(0, 80),
            targetUserId: author?.id,
          }}
        />
      )}
    </article>
  );
}
