import { useRef } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Play } from "lucide-react";
import { imageUrl, videoUrl } from "@/backend/domain/media";
import { videosQueryOptions } from "@/frontend/queries/sections";
import { AppShell } from "@/frontend/components/AppShell";

const compact = new Intl.NumberFormat("en", { notation: "compact" });

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function WatchScreen() {
  const { videoId } = useParams({ from: "/videos/$videoId" });
  const { data } = useSuspenseQuery(videosQueryOptions);
  const playerRef = useRef<HTMLVideoElement | null>(null);

  const item = data.find((v) => v.video.id === videoId);
  const upNext = data.filter((v) => v.video.id !== videoId);

  if (!item) {
    return (
      <AppShell title="Video not found">
        <div className="grid place-items-center gap-3 px-6 py-24 text-center">
          <p className="text-sm font-semibold text-foreground">This video isn't available.</p>
          <Link to="/videos" className="text-sm font-semibold text-brand">
            Back to videos
          </Link>
        </div>
      </AppShell>
    );
  }

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
        <span className="text-sm font-semibold text-muted-foreground">Back to videos</span>
      </div>

      <section aria-label={`Now playing: ${item.video.title}`}>
        <div className="relative bg-media sm:mx-6 sm:overflow-hidden sm:rounded-2xl">
          <video
            key={item.video.id}
            ref={playerRef}
            src={videoUrl(item.video.video.objectKey)}
            poster={imageUrl(item.video.video.posterKey, "large", 16 / 9)}
            className="aspect-video w-full object-contain"
            controls
            autoPlay
            playsInline
            preload="metadata"
            onLoadedMetadata={() => {
              const player = playerRef.current;
              if (!player || !item.video.progressSeconds) return;
              player.currentTime = Math.min(
                item.video.progressSeconds,
                player.duration || item.video.progressSeconds,
              );
            }}
          >
            Your browser does not support video playback.
          </video>
        </div>
        <div className="flex items-start gap-3 px-4 py-3 sm:px-6">
          <img
            src={imageUrl(item.authorAvatarKey, "thumbnail")}
            alt={item.authorName}
            className="size-10 shrink-0 rounded-full object-cover"
          />
          <div className="min-w-0">
            <h2 className="text-base font-bold leading-snug text-foreground">{item.video.title}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              @{item.authorUsername} · {compact.format(item.video.views)} views ·{" "}
              {item.video.publishedAt}
            </p>
          </div>
        </div>
      </section>

      <section className="pt-2">
        <h3 className="px-4 pb-2 text-sm font-bold text-foreground sm:px-6">Up next</h3>
        <ul className="grid md:grid-cols-2">
          {upNext.map((next) => (
            <li key={next.video.id}>
              <article className="px-4 pb-4 sm:px-6 md:px-3">
                <Link
                  to="/videos/$videoId"
                  params={{ videoId: next.video.id }}
                  aria-label={`Play ${next.video.title}`}
                  className="block w-full text-left"
                >
                  <div className="relative overflow-hidden rounded-2xl bg-surface-strong">
                    <img
                      src={imageUrl(next.video.video.posterKey, "medium", 16 / 9)}
                      alt=""
                      loading="lazy"
                      className="aspect-video w-full object-cover"
                    />
                    <span className="absolute inset-0 grid place-items-center">
                      <span className="grid size-12 place-items-center rounded-full bg-on-media/25 backdrop-blur">
                        <Play className="size-5 translate-x-0.5 fill-on-media text-on-media" />
                      </span>
                    </span>
                    <span className="absolute bottom-2 right-2 rounded bg-scrim px-1.5 py-0.5 text-[11px] font-medium text-on-media">
                      {formatDuration(next.video.video.durationSeconds)}
                    </span>
                  </div>
                  <div className="mt-2.5 flex gap-3">
                    <img
                      src={imageUrl(next.authorAvatarKey, "thumbnail")}
                      alt={next.authorName}
                      className="size-9 shrink-0 rounded-full object-cover"
                    />
                    <div className="min-w-0">
                      <h4 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
                        {next.video.title}
                      </h4>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        @{next.authorUsername} · {compact.format(next.video.views)} views
                      </p>
                    </div>
                  </div>
                </Link>
              </article>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
