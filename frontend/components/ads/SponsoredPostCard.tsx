import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, BadgeCheck, MoreHorizontal } from "lucide-react";
import { fetchActivePromotions, logAdEvent, type Promotion } from "@/backend/api/ads.functions";
import { ReportDialog } from "@/frontend/components/moderation/ReportDialog";
import { supabase } from "@/integrations/supabase/client";

/** Active promotions for feed injection. Empty (not error) when tables miss. */
export function usePromotions(viewerId: string | null) {
  return useQuery({
    queryKey: ["promotions", viewerId],
    staleTime: 60_000,
    retry: false,
    queryFn: async (): Promise<Promotion[]> => {
      try {
        const res = await fetchActivePromotions();
        if (!res.live) return [];
        let hidden = new Set<string>();
        if (viewerId) {
          const { data } = await supabase
            .from("ad_exposures")
            .select("campaign_id")
            .eq("viewer_id", viewerId)
            .eq("hidden", true);
          hidden = new Set(((data ?? []) as { campaign_id: string }[]).map((r) => r.campaign_id));
        }
        return res.promotions.filter(
          (p) => !hidden.has(p.campaignId) && p.author.id !== viewerId,
        );
      } catch {
        return [];
      }
    },
  });
}

function timeAgo(iso: string): string {
  const mins = Math.max(1, Math.round((Date.now() - Date.parse(iso)) / 60_000));
  if (mins < 60) return `${mins}m`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

/**
 * Native sponsored unit: same visual language as FeedCard, always carrying a
 * clear Sponsored label + ••• (why / hide / report / mute).
 */
export function SponsoredPostCard({
  promo,
  viewerId,
  onHide,
  onMuteAuthor,
}: {
  promo: Promotion;
  viewerId: string | null;
  onHide: (campaignId: string) => void;
  onMuteAuthor?: (authorId: string, username: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [gone, setGone] = useState(false);
  const seen = useRef(false);
  const articleRef = useRef<HTMLElement | null>(null);

  // Viewport-counted impression: ≥50% visible for 1s (signed-in viewers only).
  useEffect(() => {
    const el = articleRef.current;
    if (!el || seen.current || !viewerId) return;
    let timer: number | null = null;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          timer ??= window.setTimeout(() => {
            seen.current = true;
            void logAdEvent({ data: { campaignId: promo.campaignId, kind: "impression" } }).catch(
              () => {},
            );
            io.disconnect();
          }, 1000);
        } else if (timer !== null) {
          window.clearTimeout(timer);
          timer = null;
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [promo.campaignId, viewerId]);

  function click(kind: "click" | "profile_visit" = "click") {
    if (viewerId) void logAdEvent({ data: { campaignId: promo.campaignId, kind } }).catch(() => {});
  }

  function hide() {
    setGone(true);
    setMenuOpen(false);
    if (viewerId) void logAdEvent({ data: { campaignId: promo.campaignId, kind: "hide" } }).catch(() => {});
    onHide(promo.campaignId);
  }

  if (gone) return null;

  return (
    <article ref={articleRef} className="animate-fade-up border-b border-border bg-card">
      <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-2 px-3 pt-3 sm:px-5">
        <button
          aria-label={`View ${promo.author.displayName}`}
          onClick={() => click("profile_visit")}
          className="contents"
        >
          {promo.author.avatarUrl ? (
            <img
              src={promo.author.avatarUrl}
              alt={promo.author.displayName}
              loading="lazy"
              className="size-9 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-sm font-bold">
              {promo.author.displayName.slice(0, 1).toUpperCase()}
            </span>
          )}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1">
            <span className="truncate text-sm font-bold text-foreground">
              {promo.author.displayName}
            </span>
            {promo.author.verified && <BadgeCheck className="size-4 shrink-0 text-brand" />}
          </div>
          <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
            @{promo.author.username} · {timeAgo(promo.post.created_at)}
            <span className="inline-flex items-center gap-1 font-bold uppercase tracking-wider">
              <span className="size-1 rounded-full bg-brand" aria-hidden="true" />
              Sponsored
            </span>
          </p>
        </div>
        <span className="relative shrink-0">
          <button
            aria-label="Sponsored options"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="-mr-1 rounded-full p-1 hover:bg-secondary"
          >
            <MoreHorizontal className="size-5 text-muted-foreground" />
          </button>
          {menuOpen && (
            <>
              <button
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
                className="fixed inset-0 z-10 cursor-default"
              />
              <div className="absolute right-0 top-8 z-20 w-56 overflow-hidden rounded-2xl border border-border bg-card shadow-raise">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setWhyOpen(true);
                  }}
                  className="block w-full px-3 py-2.5 text-left text-sm font-medium hover:bg-secondary"
                >
                  Why am I seeing this?
                </button>
                <button
                  onClick={hide}
                  className="block w-full px-3 py-2.5 text-left text-sm font-medium hover:bg-secondary"
                >
                  Hide this ad
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onMuteAuthor?.(promo.author.id, promo.author.username);
                    if (viewerId) {
                      void logAdEvent({
                        data: { campaignId: promo.campaignId, kind: "hide" },
                      }).catch(() => {});
                    }
                    onHide(promo.campaignId);
                  }}
                  className="block w-full px-3 py-2.5 text-left text-sm font-medium hover:bg-secondary"
                >
                  Mute @{promo.author.username}
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setReporting(true);
                  }}
                  className="block w-full px-3 py-2.5 text-left text-sm font-medium hover:bg-secondary"
                >
                  Report ad
                </button>
              </div>
            </>
          )}
        </span>
      </header>

      {whyOpen && (
        <p className="mx-3 mt-2 rounded-xl bg-secondary p-2.5 text-xs leading-relaxed text-muted-foreground sm:mx-5">
          You&apos;re seeing this because @{promo.author.username} is promoting it to a broad
          audience. Manage interests anytime in Settings → Advertising preferences.
        </p>
      )}

      {promo.post.caption && (
        <p className="break-words px-3 py-3 text-[15px] leading-snug text-foreground sm:px-5">
          {promo.post.caption}
        </p>
      )}
      {promo.post.image_url && (
        <div className="px-3 sm:px-5">
          <img
            src={promo.post.image_url}
            alt=""
            loading="lazy"
            className="aspect-[4/5] w-full rounded-2xl border border-border bg-secondary object-cover"
          />
        </div>
      )}
      <div className="px-3 py-3 sm:px-5">
        {promo.ctaLabel && promo.ctaUrl ? (
          <a
            href={promo.ctaUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() => click()}
            className="press flex items-center justify-center gap-1.5 rounded-full bg-foreground py-2.5 text-sm font-bold text-background"
          >
            {promo.ctaLabel} <ArrowUpRight className="size-4" />
          </a>
        ) : promo.ctaLabel ? (
          <span className="block rounded-full bg-secondary py-2.5 text-center text-sm font-bold">
            {promo.ctaLabel}
          </span>
        ) : null}
      </div>
      {reporting && (
        <ReportDialog
          open
          onClose={() => setReporting(false)}
          target={{
            kind: "post",
            refId: promo.post.id,
            refTitle: promo.post.caption || "Sponsored post",
            targetUserId: promo.author.id,
          }}
        />
      )}
    </article>
  );
}
