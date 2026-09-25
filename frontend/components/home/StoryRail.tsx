import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { imageUrl } from "@/backend/domain/media";
import type { StoryItem } from "@/backend/services/feedService";
import type { Creator } from "@/backend/domain/types";
import { openCreate } from "@/frontend/components/home/nav-items";
import { cn } from "@/lib/utils";

interface Props {
  currentUser: Creator;
  currentUserAvatar?: string | null | undefined;
  currentUserUsername?: string | undefined;
  stories: StoryItem[];
}

function relativeTime(iso: string): string {
  const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 60_000));
  if (minutes < 60) return `${Math.max(1, minutes)}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function StoryRail({ currentUser, currentUserAvatar, currentUserUsername, stories }: Props) {
  const [active, setActive] = useState<number | null>(null);
  const story = active === null ? null : (stories[active] ?? null);

  useEffect(() => {
    setActive(null);
  }, [stories]);

  useEffect(() => {
    if (!story) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActive(null);
      if (event.key === "ArrowLeft") {
        setActive((index) => (index === null ? null : Math.max(0, index - 1)));
      }
      if (event.key === "ArrowRight") {
        setActive((index) => (index === null ? null : Math.min(stories.length - 1, index + 1)));
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [story, stories.length]);

  return (
    <>
      <section aria-label="Stories" className="bg-background">
        <div className="rail flex gap-4 px-4 py-3">
          <button
            onClick={() => openCreate("story")}
            aria-label="Add to your story"
            className="press animate-fade-up flex w-16 shrink-0 flex-col items-center gap-1.5"
          >
            <span className="relative block rounded-full">
              <img
                src={currentUserAvatar || imageUrl(currentUser.avatarKey, "thumbnail")}
                alt="Your story"
                loading="lazy"
                className="size-[58px] rounded-full border-2 border-background object-cover opacity-90"
              />
              <span className="absolute -bottom-0.5 -right-0.5 grid size-5 place-items-center rounded-full border-2 border-background bg-brand">
                <Plus className="size-3 text-white" strokeWidth={3} />
              </span>
            </span>
            <span className="w-full truncate text-center text-[11px] text-muted-foreground">
              You
            </span>
          </button>
          {stories.map((item, i) => (
            <button
              key={item.id}
              onClick={() => setActive(i)}
              className="press animate-fade-up flex w-16 shrink-0 flex-col items-center gap-1.5"
              style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
            >
              <span
                className={cn(
                  "group relative block rounded-full p-[2px]",
                  item.viewed ? "bg-border" : "story-ring",
                )}
              >
                <img
                  src={imageUrl(item.author.avatarKey, "thumbnail")}
                  alt={item.author.displayName}
                  loading="lazy"
                  className="size-[58px] rounded-full border-2 border-background object-cover transition-transform duration-200 group-hover:scale-105 group-active:scale-95"
                />
                {!item.viewed && (
                  <span className="absolute -right-0.5 -top-0.5 size-3.5 rounded-full border-2 border-background bg-live" />
                )}
              </span>
              <span className="w-full truncate text-center text-[11px] text-muted-foreground">
                {item.author.username}
              </span>
            </button>
          ))}
        </div>
        <span className="sr-only">{currentUserUsername ?? currentUser.username}</span>
      </section>

      {story && active !== null && (
        <div
          role="dialog"
          aria-label={`${story.author.displayName}'s story`}
          className="fixed inset-0 z-[70] mx-auto flex max-w-md bg-black text-white"
        >
          <div className="absolute inset-x-0 top-0 z-20 flex gap-1.5 p-3">
            {stories.map((item, i) => (
              <span
                key={item.id}
                className={cn("h-0.5 flex-1 rounded-full bg-white/35", i <= active && "bg-white")}
              />
            ))}
          </div>

          <div className="absolute inset-x-0 top-3 z-20 flex items-center gap-2 px-3 pt-2">
            <img
              src={imageUrl(story.author.avatarKey, "thumbnail")}
              alt=""
              className="size-8 rounded-full object-cover"
            />
            <span className="text-sm font-bold">{story.author.displayName}</span>
            <span className="text-xs text-white/65">{relativeTime(story.createdAt)}</span>
            <button
              type="button"
              onClick={() => setActive(null)}
              aria-label="Close story"
              className="ml-auto grid size-8 place-items-center rounded-full bg-black/35"
            >
              <X className="size-5" />
            </button>
          </div>

          <button
            type="button"
            aria-label="Previous story"
            onClick={() => setActive(Math.max(0, active - 1))}
            className="absolute inset-y-0 left-0 z-10 w-1/3 cursor-w-resize"
          >
            <span className="sr-only">Previous story</span>
          </button>

          <div className="relative grid min-h-full w-full place-items-center overflow-hidden">
            {story.mediaType === "image" && story.mediaUrl ? (
              <img
                src={story.mediaUrl}
                alt={story.caption || `${story.author.displayName}'s story`}
                className="size-full object-cover"
              />
            ) : story.mediaType === "video" && story.mediaUrl ? (
              <video
                key={story.id}
                src={story.mediaUrl}
                autoPlay
                playsInline
                controls
                className="size-full object-contain"
              />
            ) : (
              <div
                className="grid size-full place-items-center p-10 text-center"
                style={{ backgroundColor: story.background }}
              >
                <p className="text-xl font-bold leading-relaxed">{story.caption}</p>
              </div>
            )}

            {story.mediaType !== "text" && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5 pt-20">
                {story.overlays.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {story.overlays.map((overlay) => (
                      <span
                        key={overlay}
                        className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur"
                      >
                        {overlay}
                      </span>
                    ))}
                  </div>
                )}
                {story.caption && <p className="text-sm leading-snug">{story.caption}</p>}
              </div>
            )}
          </div>

          {active < stories.length - 1 && (
            <button
              type="button"
              aria-label="Next story"
              onClick={() => setActive(active + 1)}
              className="absolute inset-y-0 right-0 z-10 w-1/3 cursor-e-resize"
            >
              <ChevronRight className="absolute right-2 top-1/2 size-6 opacity-0" />
              <span className="sr-only">Next story</span>
            </button>
          )}
          {active > 0 && (
            <ChevronLeft className="pointer-events-none absolute left-2 top-1/2 z-10 size-6 opacity-0" />
          )}
        </div>
      )}
    </>
  );
}
