import { Plus } from "lucide-react";
import { imageUrl } from "@/backend/domain/media";
import type { StoryItem } from "@/backend/services/feedService";
import type { Creator } from "@/backend/domain/types";
import { openCreate } from "@/frontend/components/home/nav-items";
import { cn } from "@/lib/utils";

interface Props {
  currentUser: Creator;
  stories: StoryItem[];
}

export function StoryRail({ currentUser, stories }: Props) {
  return (
    <section aria-label="Stories" className="bg-background">
      <div className="rail flex gap-4 px-4 py-3">
        <button
          onClick={() => openCreate("story")}
          aria-label="Add to your story"
          className="press animate-fade-up flex w-16 shrink-0 flex-col items-center gap-1.5"
        >
          <span className="relative block rounded-full">
            <img
              src={imageUrl(currentUser.avatarKey, "thumbnail")}
              alt="Your story"
              loading="lazy"
              className="size-[58px] rounded-full border-2 border-background object-cover opacity-90"
            />
            <span className="absolute -bottom-0.5 -right-0.5 grid size-5 place-items-center rounded-full border-2 border-background bg-brand">
              <Plus className="size-3 text-white" strokeWidth={3} />
            </span>
          </span>
          <span className="w-full truncate text-center text-[11px] text-muted-foreground">You</span>
        </button>
        {stories.map(({ story, author }, i) => (
          <button
            key={story.id}
            className="press animate-fade-up flex w-16 shrink-0 flex-col items-center gap-1.5"
            style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
          >
            <span
              className={cn(
                "group relative block rounded-full p-[2px]",
                story.viewed ? "bg-border" : "story-ring",
              )}
            >
              <img
                src={imageUrl(author.avatarKey, "thumbnail")}
                alt={author.displayName}
                loading="lazy"
                className="size-[58px] rounded-full border-2 border-background object-cover transition-transform duration-200 group-hover:scale-105 group-active:scale-95"
              />
              {!story.viewed && (
                <span className="absolute -right-0.5 -top-0.5 size-3.5 rounded-full border-2 border-background bg-live" />
              )}
            </span>
            <span className="w-full truncate text-center text-[11px] text-muted-foreground">
              {author.username}
            </span>
          </button>
        ))}
      </div>
      <span className="sr-only">{currentUser.username}</span>
    </section>
  );
}
