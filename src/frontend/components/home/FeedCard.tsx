import { useState } from "react";
import { BadgeCheck, Bookmark, Heart, MessageCircle, MoreHorizontal, Play, Share2 } from "lucide-react";
import { imageSrcSet, imageUrl, placeholderUrl, videoUrl } from "@/backend/domain/media";
import type { FeedItem } from "@/backend/services/feedService";
import { ShareSheet } from "@/frontend/components/overlays/ShareSheet";
import { cn } from "@/lib/utils";

const compact = new Intl.NumberFormat("en", { notation: "compact" });

/** Deterministic clock so SSR markup and hydrated markup agree exactly. */
const REFERENCE_NOW = Date.parse("2026-08-27T12:00:00.000Z");

function timeAgo(iso: string): string {
  const mins = Math.max(1, Math.round((REFERENCE_NOW - Date.parse(iso)) / 60_000));
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

export function FeedCard({ item }: { item: FeedItem }) {
  const { post, author, clipObjectKey } = item;
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [sharing, setSharing] = useState(false);
  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/u/${author.username}` : "";

  const image = post.media.find((m) => m.kind === "image");
  const aspect = image ? image.width / image.height : 1;

  return (
    <article className="border-b border-border bg-card">
      <header className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-start gap-2 px-3 pt-3 sm:gap-3 sm:px-5">
        <img
          src={imageUrl(author.avatarKey, "thumbnail")}
          alt={author.displayName}
          loading="lazy"
          className="size-9 shrink-0 rounded-full object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1">
            <span className="truncate text-sm font-bold text-foreground">{author.displayName}</span>
            {author.verified && <BadgeCheck className="size-4 shrink-0 text-brand" />}
          </div>
          <p className="truncate text-xs text-muted-foreground">
            @{author.username} · {timeAgo(post.createdAt)}
          </p>
        </div>
        <button
          onClick={() => setFollowing((v) => !v)}
          className="shrink-0 pt-0.5 text-sm font-semibold text-brand"
        >
          {following ? "Following" : "Follow"}
        </button>
        <button aria-label="More options" className="-mr-1 shrink-0 rounded-full p-1">
          <MoreHorizontal className="size-5 text-muted-foreground" />
        </button>
      </header>

       <p className="break-words px-3 py-3 text-[15px] leading-snug text-foreground sm:px-5">
        {post.caption}
        {post.hashtags.length > 0 && (
          <span className="text-brand"> {post.hashtags.map((h) => `#${h}`).join(" ")}</span>
        )}
      </p>

      {clipObjectKey ? (
        <div className="relative bg-surface-strong">
          <video
            className="aspect-[4/5] w-full object-cover"
            src={videoUrl(clipObjectKey)}
            poster={imageUrl(image?.objectKey ?? post.id, "large", 0.8)}
            playsInline
            loop
            muted
            controls={playing}
            preload="none"
            onPlay={() => setPlaying(true)}
          />
          {!playing && (
            <button
              aria-label="Play video"
              onClick={(e) => {
                const video = e.currentTarget.previousElementSibling as HTMLVideoElement | null;
                setPlaying(true);
                void video?.play();
              }}
              className="absolute inset-0 grid place-items-center bg-scrim/20"
            >
              <span className="grid size-14 place-items-center rounded-full bg-on-media/90">
                <Play className="size-6 translate-x-0.5 fill-foreground text-foreground" />
              </span>
            </button>
          )}
        </div>
      ) : image ? (
        <img
          src={imageUrl(image.objectKey, "large", aspect)}
          srcSet={imageSrcSet(image.objectKey, aspect)}
          sizes="(max-width: 768px) 100vw, 768px"
          alt={image.alt}
          width={image.width}
          height={image.height}
          loading="lazy"
          decoding="async"
          style={{ backgroundImage: `url(${placeholderUrl(image.objectKey)})`, backgroundSize: "cover" }}
          className="w-full bg-surface-strong object-cover"
        />
      ) : null}

      <div className="flex items-center justify-between gap-3 px-3 py-3 sm:px-5">
        <button
          onClick={() => setLiked((v) => !v)}
          aria-pressed={liked}
          aria-label="Like"
          className="flex items-center gap-2"
        >
          <Heart className={cn("size-5", liked ? "fill-live text-live" : "text-foreground")} />
          <span className="text-sm text-foreground">
            {compact.format(post.metrics.likes + (liked ? 1 : 0))}
          </span>
        </button>
        <button aria-label="Comment" className="flex items-center gap-2">
          <MessageCircle className="size-5 text-foreground" />
          <span className="text-sm text-foreground">{compact.format(post.metrics.comments)}</span>
        </button>
        <button aria-label="Share" onClick={() => setSharing(true)} className="flex items-center gap-2">
          <Share2 className="size-5 text-foreground" />
          <span className="text-sm text-foreground">{compact.format(post.metrics.shares)}</span>
        </button>
        <button
          onClick={() => setSaved((v) => !v)}
          aria-pressed={saved}
          aria-label="Save"
          className=""
        >
          <Bookmark className={cn("size-5", saved ? "fill-brand text-brand" : "text-foreground")} />
        </button>
      </div>

      <ShareSheet
        open={sharing}
        onClose={() => setSharing(false)}
        url={shareUrl}
        message={`${author.displayName} on WIZZ: ${post.caption}`}
      />
    </article>
  );
}
