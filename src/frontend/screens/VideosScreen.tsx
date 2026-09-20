import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Play } from "lucide-react";
import { imageUrl } from "@/backend/domain/media";
import { videosQueryOptions } from "@/frontend/queries/sections";
import { AppShell } from "@/frontend/components/AppShell";
import { cn } from "@/lib/utils";

const compact = new Intl.NumberFormat("en", { notation: "compact" });

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function VideosScreen() {
  const { data } = useSuspenseQuery(videosQueryOptions);
  const [category, setCategory] = useState("For You");
  const categories = Array.from(
    new Set(["For You", ...data.map((v) => v.video.category)]),
  );
  const filtered =
    category === "For You" ? data : data.filter((v) => v.video.category === category);
  const continueWatching = data.filter((v) => v.video.progressSeconds);

  return (
    <AppShell title="Videos">
      <div className="rail flex gap-2 px-4 py-3 sm:px-6">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-semibold",
              c === category
                ? "bg-brand text-brand-foreground"
                : "border border-border bg-background text-foreground",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {continueWatching.length > 0 && (
        <section className="pt-1">
          <h3 className="px-4 pb-2 text-sm font-bold text-foreground sm:px-6">
            Continue watching
          </h3>
          <div className="rail flex gap-3 px-4 pb-2 sm:px-6">
            {continueWatching.map((item) => (
              <article key={item.video.id} className="w-[68vw] max-w-[260px] shrink-0 sm:w-[260px]">
                <Link
                  to="/videos/$videoId"
                  params={{ videoId: item.video.id }}
                  aria-label={`Play ${item.video.title}`}
                  className="block w-full text-left"
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
                  <h4 className="mt-1.5 line-clamp-1 text-sm font-semibold text-foreground">
                    {item.video.title}
                  </h4>
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="pt-2">
        <h3 className="px-4 pb-2 text-sm font-bold text-foreground sm:px-6">Recommended</h3>
        <ul className="grid md:grid-cols-2">
          {filtered.map((item) => (
            <li key={item.video.id}>
              <article className="px-4 pb-4 sm:px-6 md:px-3">
                <Link
                  to="/videos/$videoId"
                  params={{ videoId: item.video.id }}
                  aria-label={`Play ${item.video.title}`}
                  className="block w-full text-left"
                >
                  <div className="relative overflow-hidden rounded-2xl bg-surface-strong">
                    <img
                      src={imageUrl(item.video.video.posterKey, "medium", 16 / 9)}
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
                      {formatDuration(item.video.video.durationSeconds)}
                    </span>
                  </div>
                  <div className="mt-2.5 flex gap-3">
                    <img
                      src={imageUrl(item.authorAvatarKey, "thumbnail")}
                      alt={item.authorName}
                      className="size-9 shrink-0 rounded-full object-cover"
                    />
                    <div className="min-w-0">
                      <h4 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
                        {item.video.title}
                      </h4>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        @{item.authorUsername} · {compact.format(item.video.views)} views
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
