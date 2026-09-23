import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BadgeCheck,
  Flag,
  Heart,
  Maximize,
  Minimize,
  Pause,
  PictureInPicture2,
  Play,
  Share2,
  ThumbsDown,
  ThumbsUp,
  Volume2,
  VolumeX,
} from "lucide-react";
import { imageUrl, videoUrl } from "@/backend/domain/media";
import { relatedQueryOptions, videoQueryOptions } from "@/frontend/queries/sections";
import { AppShell } from "@/frontend/components/AppShell";
import { ShareSheet } from "@/frontend/components/overlays/ShareSheet";
import { ReportDialog } from "@/frontend/components/moderation/ReportDialog";
import { useAuthGate } from "@/frontend/hooks/useAuthGate";
import { cn } from "@/lib/utils";

const compact = new Intl.NumberFormat("en", { notation: "compact" });
const SPEEDS = [0.5, 1, 1.25, 1.5, 2] as const;

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function Player({
  src,
  poster,
  title,
  onDoubleLike,
}: {
  src: string;
  poster: string;
  title: string;
  onDoubleLike: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hideTimer = useRef<number | null>(null);
  const tapTimer = useRef<number | null>(null);
  const [burst, setBurst] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [rate, setRate] = useState<number>(1);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [controls, setControls] = useState(true);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [pipSupported, setPipSupported] = useState(false);

  useEffect(() => {
    setPipSupported(
      typeof document !== "undefined" &&
        "pictureInPictureEnabled" in document &&
        document.pictureInPictureEnabled,
    );
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, []);

  function poke() {
    setControls(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setControls(false);
    }, 2600);
  }

  useEffect(() => {
    poke();
  }, []);

  async function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      await v.play();
    } else {
      v.pause();
    }
  }

  async function toggleFullscreen() {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await el.requestFullscreen();
    }
  }

  async function togglePip() {
    const v = videoRef.current as HTMLVideoElement & {
      requestPictureInPicture?: () => Promise<unknown>;
    };
    if (!v) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await v.requestPictureInPicture?.();
      }
    } catch {
      // unsupported mid-playback — ignore
    }
  }

  function seek(frac: number) {
    const v = videoRef.current;
    if (!v || !Number.isFinite(v.duration)) return;
    v.currentTime = frac * v.duration;
    setCurrent(v.currentTime);
  }

  const progress = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={poke}
      className="group relative aspect-video w-full overflow-hidden bg-black sm:rounded-2xl"
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        playsInline
        preload="metadata"
        onClick={() => {
          if (tapTimer.current) {
            window.clearTimeout(tapTimer.current);
            tapTimer.current = null;
            setBurst((n) => n + 1);
            onDoubleLike();
            return;
          }
          tapTimer.current = window.setTimeout(() => {
            tapTimer.current = null;
            setControls((c) => !c);
            poke();
          }, 280);
        }}
        onPlay={() => {
          setPlaying(true);
          poke();
        }}
        onPause={() => {
          setPlaying(false);
          setControls(true);
        }}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration);
          e.currentTarget.playbackRate = rate;
        }}
        onRateChange={(e) => setRate(e.currentTarget.playbackRate)}
        onVolumeChange={(e) => {
          setMuted(e.currentTarget.muted);
          setVolume(e.currentTarget.volume);
        }}
        className="size-full object-contain"
      />
      {burst > 0 && (
        <span key={burst} className="pointer-events-none absolute inset-0 grid place-items-center">
          <Heart className="animate-heart-burst size-20 fill-white text-white drop-shadow-lg" />
        </span>
      )}
      {!playing && (
        <button
          aria-label={`Play ${title}`}
          onClick={togglePlay}
          className="absolute inset-0 grid place-items-center"
        >
          <span className="animate-scale-in grid size-16 place-items-center rounded-full bg-black/60 backdrop-blur">
            <Play className="size-7 translate-x-0.5 fill-white text-white" />
          </span>
        </button>
      )}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2.5 pt-10 transition-opacity",
          controls ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <input
          type="range"
          min={0}
          max={1000}
          value={Math.round(progress * 10)}
          onChange={(e) => seek(Number(e.target.value) / 1000)}
          aria-label="Seek"
          className="w-full accent-white"
        />
        <div className="mt-1 flex items-center gap-1.5 text-white">
          <button
            aria-label={playing ? "Pause" : "Play"}
            onClick={togglePlay}
            className="rounded-full p-1.5 hover:bg-white/15"
          >
            {playing ? (
              <Pause className="size-5 fill-white" />
            ) : (
              <Play className="size-5 fill-white" />
            )}
          </button>
          <button
            aria-label={muted || volume === 0 ? "Unmute" : "Mute"}
            onClick={() => {
              const v = videoRef.current;
              if (v) v.muted = !v.muted;
            }}
            className="rounded-full p-1.5 hover:bg-white/15"
          >
            {muted || volume === 0 ? (
              <VolumeX className="size-5" />
            ) : (
              <Volume2 className="size-5" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={100}
            value={muted ? 0 : Math.round(volume * 100)}
            onChange={(e) => {
              const v = videoRef.current;
              if (!v) return;
              v.muted = false;
              v.volume = Number(e.target.value) / 100;
            }}
            aria-label="Volume"
            className="hidden w-16 accent-white sm:block"
          />
          <span className="ml-1 text-xs font-medium tabular-nums">
            {formatDuration(current)} / {formatDuration(duration)}
          </span>
          <span className="flex-1" />
          <div className="relative">
            <button
              aria-label="Playback speed"
              onClick={() => setSpeedOpen((v) => !v)}
              className="rounded-md px-2 py-1.5 text-xs font-bold hover:bg-white/15"
            >
              {rate}×
            </button>
            {speedOpen && (
              <div className="absolute bottom-9 right-0 overflow-hidden rounded-xl bg-black/90 py-1">
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      const v = videoRef.current;
                      if (v) v.playbackRate = s;
                      setRate(s);
                      setSpeedOpen(false);
                    }}
                    className={cn(
                      "block w-full px-4 py-1.5 text-left text-xs font-semibold hover:bg-white/15",
                      rate === s ? "text-brand" : "text-white",
                    )}
                  >
                    {s}×
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className="rounded-md px-2 py-1.5 text-xs font-bold text-white/80">Auto</span>
          {pipSupported && (
            <button
              aria-label="Picture in picture"
              onClick={togglePip}
              className="rounded-full p-1.5 hover:bg-white/15"
            >
              <PictureInPicture2 className="size-5" />
            </button>
          )}
          <button
            aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
            onClick={toggleFullscreen}
            className="rounded-full p-1.5 hover:bg-white/15"
          >
            {fullscreen ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

export function WatchScreen() {
  const { videoId } = useParams({ from: "/watch/$videoId" });
  const { data: item } = useSuspenseQuery(videoQueryOptions(videoId));
  const { data: related = [] } = useSuspenseQuery(relatedQueryOptions(videoId));

  const [liked, setLiked] = useState<null | "up" | "down">(null);
  const [subscribed, setSubscribed] = useState(false);
  const requireAuth = useAuthGate();
  const [expanded, setExpanded] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    setLiked(null);
    setSubscribed(false);
    setExpanded(false);
    setSharing(false);
  }, [videoId]);

  if (!item) {
    return (
      <AppShell title="Video not found">
        <div className="grid place-items-center gap-3 px-6 py-24 text-center">
          <p className="text-base font-bold text-foreground">This video isn't available.</p>
          <p className="text-sm text-muted-foreground">
            It may have been removed or the link is wrong.
          </p>
          <Link
            to="/videos"
            className="mt-2 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-brand-foreground"
          >
            Back to videos
          </Link>
        </div>
      </AppShell>
    );
  }

  const baseLikes = Math.max(1, Math.round(item.video.views * 0.04));
  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/watch/${item.video.id}` : "";

  return (
    <AppShell title={item.video.title}>
      <div className="flex items-center gap-2 px-4 py-3 sm:px-6">
        <Link
          to="/videos"
          aria-label="Back to videos"
          className="grid size-9 place-items-center rounded-full hover:bg-secondary"
        >
          <ArrowLeft className="size-5 text-foreground" />
        </Link>
        <span className="truncate text-sm font-semibold text-muted-foreground">
          {item.video.category}
        </span>
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6 lg:px-6">
        <div className="min-w-0">
          <div className="sm:px-0">
            <Player
              key={item.video.id}
              src={videoUrl(item.video.video.objectKey)}
              poster={imageUrl(item.video.video.posterKey, "large", 16 / 9)}
              title={item.video.title}
              onDoubleLike={() => {
                if (!requireAuth()) return;
                setLiked((v) => (v === "up" ? v : "up"));
              }}
            />
          </div>

          <div className="px-4 pt-3 sm:px-0">
            <h1 className="text-base font-bold leading-snug text-foreground sm:text-lg">
              {item.video.title}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              {compact.format(item.video.views)} views · {item.video.publishedAt}
            </p>

            <div className="mt-3 flex items-center gap-3">
              <img
                src={imageUrl(item.authorAvatarKey, "thumbnail")}
                alt={item.authorName}
                className="size-10 shrink-0 rounded-full object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1 truncate text-sm font-bold text-foreground">
                  {item.authorName}
                  {item.authorVerified && <BadgeCheck className="size-4 shrink-0 text-brand" />}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {compact.format(item.authorFollowers)} subscribers
                </p>
              </div>
              <button
                onClick={() => {
                  if (!requireAuth()) return;
                  setSubscribed((v) => !v);
                }}
                className={cn(
                  "press shrink-0 rounded-full px-4 py-2 text-sm font-bold",
                  subscribed ? "bg-secondary text-foreground" : "bg-foreground text-background",
                )}
              >
                {subscribed ? "Subscribed" : "Subscribe"}
              </button>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <div className="flex items-center overflow-hidden rounded-full bg-secondary">
                <button
                  aria-label="Like"
                  aria-pressed={liked === "up"}
                  onClick={() => {
                    if (!requireAuth()) return;
                    setLiked((v) => (v === "up" ? null : "up"));
                  }}
                  className="press flex items-center gap-1.5 py-2 pl-4 pr-3"
                >
                  <ThumbsUp className={cn("size-4", liked === "up" && "fill-foreground")} />
                  <span className="text-sm font-semibold tabular-nums">
                    {compact.format(baseLikes + (liked === "up" ? 1 : 0))}
                  </span>
                </button>
                <span className="h-5 w-px bg-border" aria-hidden="true" />
                <button
                  aria-label="Dislike"
                  aria-pressed={liked === "down"}
                  onClick={() => {
                    if (!requireAuth()) return;
                    setLiked((v) => (v === "down" ? null : "down"));
                  }}
                  className="press py-2 pl-3 pr-4"
                >
                  <ThumbsDown className={cn("size-4", liked === "down" && "fill-foreground")} />
                </button>
              </div>
              <button
                onClick={() => setSharing(true)}
                className="press flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-sm font-semibold"
              >
                <Share2 className="size-4" /> Share
              </button>
              <button
                onClick={() => setReporting(true)}
                aria-label="Report video"
                className="press grid size-9 shrink-0 place-items-center rounded-full bg-secondary"
              >
                <Flag className="size-4" />
              </button>
            </div>

            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-3 block w-full rounded-2xl bg-secondary p-3 text-left"
            >
              <p className="text-xs font-bold text-foreground sm:text-sm">
                {compact.format(item.video.views)} views · {item.video.publishedAt} · #
                {item.video.category.replace(/\s/g, "")}
              </p>
              <p
                className={cn(
                  "mt-1 text-xs leading-relaxed text-foreground sm:text-sm",
                  !expanded && "line-clamp-2",
                )}
              >
                {item.video.description}
              </p>
              {item.video.tags.length > 0 && (
                <span className="mt-2 flex flex-wrap gap-1.5">
                  {item.video.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-background px-2.5 py-1 text-[11px] font-semibold text-brand"
                    >
                      #{t}
                    </span>
                  ))}
                </span>
              )}
              <span className="mt-1.5 block text-xs font-bold text-muted-foreground">
                {expanded ? "Show less" : "…more"}
              </span>
            </button>
          </div>
        </div>

        <aside className="min-w-0 px-4 pt-4 sm:px-6 lg:px-0 lg:pt-0">
          <h2 className="pb-2 text-sm font-bold text-foreground">Up next</h2>
          {related.length === 0 ? (
            <p className="rounded-2xl bg-secondary p-4 text-center text-xs text-muted-foreground">
              No related videos yet — check back soon.
            </p>
          ) : (
            <ul className="space-y-3">
              {related.map((next) => (
                <li key={next.video.id}>
                  <Link
                    to="/watch/$videoId"
                    params={{ videoId: next.video.id }}
                    className="group flex gap-2.5"
                  >
                    <span className="relative w-40 shrink-0 overflow-hidden rounded-xl bg-surface-strong sm:w-44">
                      <img
                        src={imageUrl(next.video.video.posterKey, "medium", 16 / 9)}
                        alt=""
                        loading="lazy"
                        className="aspect-video w-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                      <span className="absolute bottom-1.5 right-1.5 rounded bg-scrim px-1.5 py-0.5 text-[11px] font-medium text-on-media">
                        {formatDuration(next.video.video.durationSeconds)}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1 py-0.5">
                      <span className="line-clamp-2 text-[13px] font-semibold leading-snug text-foreground">
                        {next.video.title}
                      </span>
                      <span className="mt-1 block truncate text-xs text-muted-foreground">
                        {next.authorName}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {compact.format(next.video.views)} views
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
      <div className="h-6" aria-hidden="true" />

      <ShareSheet
        open={sharing}
        onClose={() => setSharing(false)}
        url={shareUrl}
        message={`${item.video.title} — ${item.authorName} on WIZZ`}
      />
      <ReportDialog
        open={reporting}
        onClose={() => setReporting(false)}
        target={{
          kind: "video",
          refId: item.video.id,
          refTitle: item.video.title,
          targetUserId: item.video.authorId,
        }}
      />
    </AppShell>
  );
}
