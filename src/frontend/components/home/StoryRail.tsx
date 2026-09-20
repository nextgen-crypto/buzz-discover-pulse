
import { imageUrl } from "@/backend/domain/media";
import type { StoryItem } from "@/backend/services/feedService";
import type { Creator } from "@/backend/domain/types";
import { cn } from "@/lib/utils";

interface Props {
  currentUser: Creator;
  stories: StoryItem[];
}

export function StoryRail({ currentUser, stories }: Props) {
  return (
    <section aria-label="Stories" className="bg-background">
      <div className="rail flex gap-4 px-4 py-3">

        {stories.map(({ story, author }) => (
          <button key={story.id} className="flex w-16 shrink-0 flex-col items-center gap-1.5">
            <span
              className={cn(
                "block rounded-full p-[2px]",
                story.viewed ? "bg-border" : "bg-brand",
              )}
            >
              <img
                src={imageUrl(author.avatarKey, "thumbnail")}
                alt={author.displayName}
                loading="lazy"
                className="size-[58px] rounded-full border-2 border-background object-cover"
              />
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
