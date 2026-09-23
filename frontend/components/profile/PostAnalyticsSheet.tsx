import { useEffect, useState } from "react";
import { Sheet } from "@/frontend/components/overlays/Sheet";
import type { ProfilePost } from "@/frontend/hooks/useMyProfileData";
import { supabase } from "@/integrations/supabase/client";

interface Stats {
  impressions: number;
  plays: number;
  completes: number;
  likes: number;
}

/**
 * Owner-only analytics. Reads the public post_stats row (trigger-maintained)
 * plus a best-effort likes count. Degrades to local metadata when the
 * backend tables are missing — never blocks the manage flow.
 */
export function PostAnalyticsSheet({
  open,
  onClose,
  post,
}: {
  open: boolean;
  onClose: () => void;
  post: ProfilePost;
}) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [collecting, setCollecting] = useState(true);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const [{ data: row }, likesRes] = await Promise.all([
          supabase.from("post_stats").select("impressions, plays, completes").eq("post_id", post.id).maybeSingle(),
          supabase.from("post_likes").select("user_id", { count: "exact", head: true }).eq("post_id", post.id),
        ]);
        if (cancelled) return;
        const r = (row ?? {}) as Partial<Stats>;
        setStats({
          impressions: r.impressions ?? 0,
          plays: r.plays ?? 0,
          completes: r.completes ?? 0,
          likes: likesRes.error ? -1 : (likesRes.count ?? 0),
        });
      } catch {
        if (!cancelled) setStats(null);
      } finally {
        if (!cancelled) setCollecting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, post.id]);

  if (!open) return null;

  const cards: { label: string; value: string }[] = stats
    ? [
        { label: "Views", value: `${stats.impressions.toLocaleString()}` },
        { label: "Plays", value: `${stats.plays.toLocaleString()}` },
        {
          label: "Completion",
          value:
            stats.plays > 0 ? `${Math.round((stats.completes / stats.plays) * 100)}%` : "—",
        },
        { label: "Likes", value: stats.likes < 0 ? "—" : `${stats.likes.toLocaleString()}` },
        { label: "Comments", value: `${(post.comments_count ?? 0).toLocaleString()}` },
        {
          label: "Engagement",
          value:
            stats.impressions > 0
              ? `${(((stats.likes < 0 ? 0 : stats.likes) + (post.comments_count ?? 0)) / stats.impressions * 100).toFixed(1)}%`
              : "—",
        },
      ]
    : [];

  return (
    <Sheet open={open} onClose={onClose} title="Analytics">
      <div className="space-y-3 pb-2">
        <p className="truncate text-sm font-semibold">{post.caption.slice(0, 80) || "Untitled"}</p>
        {collecting ? (
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-secondary" />
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-3 gap-2">
            {cards.map((c) => (
              <div key={c.label} className="rounded-2xl bg-secondary p-3 text-center">
                <p className="text-lg font-bold">{c.value}</p>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {c.label}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-secondary p-3 text-center text-sm text-muted-foreground">
            Analytics tables missing — run the migrations in Supabase, then pull to refresh.
          </p>
        )}
        <p className="text-center text-[11px] text-muted-foreground">
          Private to you. Retention graphs land with video processing.
        </p>
      </div>
    </Sheet>
  );
}
