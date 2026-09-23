import type { StoryTab } from "@/frontend/hooks/useStoryDetail";
import { cn } from "@/lib/utils";

/** Top / Latest: plain text tabs, 2px underline on the active one. */
export function TopLatestTabs({
  tab,
  onChange,
}: {
  tab: StoryTab;
  onChange: (tab: StoryTab) => void;
}) {
  return (
    <div className="flex gap-6 border-b border-border px-4">
      {(["Top", "Latest"] as const).map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          aria-pressed={tab === t}
          className={cn(
            "relative py-2.5 text-sm",
            tab === t ? "font-bold text-foreground" : "font-medium text-muted-foreground",
          )}
        >
          {t}
          {tab === t && (
            <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand" />
          )}
        </button>
      ))}
    </div>
  );
}
