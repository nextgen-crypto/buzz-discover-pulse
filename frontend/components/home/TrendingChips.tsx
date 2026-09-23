import { TrendingUp } from "lucide-react";
import type { TrendingTopic } from "@/backend/domain/types";
import { cn } from "@/lib/utils";

export function TrendingChips({
  topics,
  active,
  onSelect,
}: {
  topics: TrendingTopic[];
  active: string | null;
  onSelect: (label: string | null) => void;
}) {
  return (
    <section aria-label="Trending now" className="border-b border-border bg-background">
      <div className="flex items-center gap-1.5 px-4 pt-3">
        <TrendingUp className="size-3.5 text-foreground" />
        <h2 className="text-xs font-semibold text-foreground">Trending</h2>
      </div>
      <div className="rail flex gap-2 px-4 pb-3 pt-2" role="tablist" aria-label="Filter feed">
        <button
          role="tab"
          aria-selected={active === null}
          onClick={() => onSelect(null)}
          className={cn(
            "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
            active === null ? "bg-brand text-brand-foreground" : "bg-brand-soft text-brand",
          )}
        >
          All
        </button>
        {topics.map((t) => {
          const selected = active === t.label;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={selected}
              onClick={() => onSelect(selected ? null : t.label)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                selected ? "bg-brand text-brand-foreground" : "bg-brand-soft text-brand",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
