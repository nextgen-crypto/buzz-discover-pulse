import { Link } from "@tanstack/react-router";
import type { NewsStory } from "@/frontend/hooks/useNewsStories";
import { formatCount, newsTimeAgo } from "@/frontend/components/news/newsFormat";
import { cn } from "@/lib/utils";

function stateTone(state: NewsStory["state"]): string {
  if (state === "breaking" || state === "live") return "text-live";
  if (state === "trending") return "text-brand";
  return "text-muted-foreground";
}

/**
 * Screen 1 story row: overlapping source avatars, wrapping headline,
 * `{time} · {category} · {N} posts` meta, optional state label. Flat row.
 */
export function StoryListItem({ story }: { story: NewsStory }) {
  const words = story.headline.split(/\s+/).filter(Boolean);
  const marks = [words[0]?.slice(0, 1) ?? "N", words[1]?.slice(0, 1) ?? story.category.slice(0, 1)].map(
    (c) => c.toUpperCase(),
  );
  return (
    <Link to="/news/$articleId" params={{ articleId: story.id }} className="block px-4 py-3">
      <span className="flex items-center" aria-hidden="true">
        {marks.map((ch, i) => (
          <span
            key={i}
            className="-ml-1 grid size-5 place-items-center rounded-full bg-secondary text-[9px] font-black text-foreground ring-2 ring-background first:ml-0"
          >
            {ch}
          </span>
        ))}
      </span>
      <h3 className="mt-1.5 text-[15px] font-bold leading-snug text-foreground">
        {story.headline}
      </h3>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>
          {newsTimeAgo(story.createdAt)} · {story.category} · {formatCount(story.postCount)} posts
        </span>
        <span className={cn("font-bold uppercase tracking-wider", stateTone(story.state))}>
          · {story.state}
        </span>
      </p>
    </Link>
  );
}
