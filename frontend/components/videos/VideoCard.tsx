import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Heart, Play } from "lucide-react";
import { imageUrl } from "@/backend/domain/media";
import type { VideoItem } from "@/backend/api/sections.functions";
import { cn } from "@/lib/utils";

const compact = new Intl.NumberFormat("en", { notation: "compact" });
const DOUBLE_TAP_MS = 280;

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * YouTube-style card with TikTok double-tap: single tap opens /watch,
 * double tap likes with a heart burst. Compact rail variant for
 * continue-watching (tap opens, heart button likes).
 */
export function VideoCard({
  item,
  variant = "grid",
}: {
  item: VideoItem;
  variant?: "grid" | "rail";
}) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [burst, setBurst] = useState(0);
  const tapTimer = useRef<number | null>(null);

  const baseLikes = Math.max(1, Math.round(item.video.views * 0.04));

  function open() {
    void navigate({ to: "/watch/$videoId", params: { videoId: item.video.id } });
  }

  function doLike() {
    if (!liked) {
      setLiked(true);
      setBurst((n) => n + 1);
    } else {
      setLiked(false);
    }
  }

  function handleTap() {
    if (tapTimer.current) {
      window.clearTimeout(tapTimer.current);
      tapTimer.current = null;
      doLike();
      return;
    }
    tapTimer.current = window.setTimeout(() => {
      tapTimer.current = null;
      open();
    }, DOUBLE_TAP_MS);
  }

  const likeButton =
    variant === "grid" ? (
      <button
        aria-label="Like video"
        aria-pressed={liked}
        onClick={(e) => {
          e.stopPropagation();
          doLike();
        }}
        className="press flex items-center gap-1"
      >
        <Heart
          className={cn(
            "size-4",
            liked ? "animate-pop fill-live text-live" : "text-muted-foreground",
          )}
        />
        <span className="text-xs font-semibold text-muted-foreground">
          {compact.format(baseLikes + (liked ? 1 : 0))}
        </span>
      </button>
    ) : (
      <button
        aria-label="Like video"
        aria-pressed={liked}
        onClick={(e) => {
          e.stopPropagation();
          doLike();
        }}
        className="press shrink-0 rounded-full bg-secondary p-1.5"
      >
        <Heart
          className={cn("size-3.5", liked ? "fill-live text-live" : "text-muted-foreground")}
        />
      </button>
    );

  if (variant === "rail") {
    return (
      <article className="w-[68vw] max-w-[260px] shrink-0 sm:w-[260px]">
        <div
          onClick={handleTap}
          className="block w-full cursor-pointer text-left"
          role="link"
          aria-label={`Play ${item.video.title}`}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter") open();
          }}
        >
          <div className="relative overflow-hidden rounded-xl bg-surface-strong">
            <img
              src={imageUrl(item.video.video.posterKey, "medium", 16 / 9)}
              alt=""
              loading="lazy"
              className="aspect-video w-full object-cover"
            />
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid size-10 place-items-center rounded-full bg-on-media/80">
                <Play className="size-4 translate-x-0.5 fill-foreground text-foreground" />
              </span>
            </span>
            {burst > 0 && (
              <span
                key={burst}
                className="pointer-events-none absolute inset-0 grid place-items-center"
              >
                <Heart className="animate-heart-burst size-14 fill-white text-white drop-shadow-lg" />
              </span>
            )}
            <span className="absolute bottom-2 right-2 rounded bg-scrim px-1.5 py-0.5 text-[11px] font-medium text-on-media">
              {formatDuration(item.video.video.durationSeconds)}
            </span>
            <span
              className="absolute bottom-0 left-0 h-1 bg-brand"
              style={{
                width: `${Math.min(100, ((item.video.progressSeconds ?? 0) / item.video.video.durationSeconds) * 100)}%`,
              }}
            />
          </div>
          <div className="mt-1.5 flex items-start gap-2">
            <h4 className="line-clamp-1 min-w-0 flex-1 text-sm font-semibold text-foreground">
              {item.video.title}
            </h4>
            {likeButton}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="px-4 pb-4 sm:px-6 md:px-3">
      <div
        onClick={handleTap}
        className="group block w-full cursor-pointer text-left"
        role="link"
        aria-label={`Play ${item.video.title}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") open();
        }}
      >
        <div className="relative overflow-hidden rounded-2xl bg-surface-strong">
          <img
            src={imageUrl(item.video.video.posterKey, "medium", 16 / 9)}
            alt=""
            loading="lazy"
            className="aspect-video w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
          />
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid size-12 place-items-center rounded-full bg-on-media/25 backdrop-blur">
              <Play className="size-5 translate-x-0.5 fill-on-media text-on-media" />
            </span>
          </span>
          {burst > 0 && (
            <span
              key={burst}
              className="pointer-events-none absolute inset-0 grid place-items-center"
            >
              <Heart className="animate-heart-burst size-16 fill-white text-white drop-shadow-lg" />
            </span>
          )}
          <span className="absolute bottom-2 right-2 rounded bg-scrim px-1.5 py-0.5 text-[11px] font-medium text-on-media">
            {formatDuration(item.video.video.durationSeconds)}
          </span>
        </div>
        <div className="mt-2.5 flex gap-3">
          <img
            src={imageUrl(item.authorAvatarKey, "thumbnail")}
            alt={item.authorName}
            className="size-9 shrink-0 rounded-full object-cover"
          />
          <div className="min-w-0 flex-1">
            <h4 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
              {item.video.title}
            </h4>
            <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="truncate">
                @{item.authorUsername} · {compact.format(item.video.views)} views
              </span>
              {likeButton}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
