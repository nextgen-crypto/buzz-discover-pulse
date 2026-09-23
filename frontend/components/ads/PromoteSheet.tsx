import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { Sheet } from "@/frontend/components/overlays/Sheet";
import type { ProfilePost } from "@/frontend/hooks/useMyProfileData";
import { createCampaign, listMyCampaigns, updateMyCampaign } from "@/backend/api/ads.functions";
import { cn } from "@/lib/utils";

const OBJECTIVES = [
  { id: "reach", label: "More reach" },
  { id: "engagement", label: "Engagement" },
  { id: "profile_visits", label: "Profile visits" },
  { id: "followers", label: "Followers" },
  { id: "website_visits", label: "Website visits" },
  { id: "product", label: "Product" },
  { id: "app_downloads", label: "App downloads" },
  { id: "event", label: "Event" },
  { id: "messages", label: "Messages" },
] as const;

const PACKAGES = [
  { id: "starter", label: "Starter", price: "TZS 10,000", days: "1 day", impressions: 1000 },
  { id: "growth", label: "Growth", price: "TZS 20,000", days: "3 days", impressions: 5000 },
  { id: "business", label: "Business", price: "TZS 50,000", days: "7 days", impressions: 20000 },
  { id: "custom", label: "Custom", price: "You set", days: "1–30 days", impressions: 0 },
] as const;

function estimate(impressions: number): string {
  if (impressions <= 0) return "—";
  const lo = Math.round(impressions * 0.6).toLocaleString();
  const hi = Math.round(impressions * 0.8).toLocaleString();
  return `${lo}–${hi} people (est.)`;
}

/**
 * Owner-only promote flow. Compact single sheet: objective → package →
 * budget/duration (custom) → CTA → review → submit for approval.
 * Includes a minimal "My campaigns" list (pause / resume / stop).
 */
export function PromoteSheet({
  open,
  onClose,
  userId,
  post,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  post: ProfilePost;
}) {
  const queryClient = useQueryClient();
  const create = useServerFn(createCampaign);
  const [tab, setTab] = useState<"new" | "mine">("new");
  const [objective, setObjective] = useState<string>("reach");
  const [pkg, setPkg] = useState<string>("starter");
  const [budget, setBudget] = useState("20000");
  const [days, setDays] = useState("3");
  const [ctaLabel, setCtaLabel] = useState("Learn more");
  const [ctaUrl, setCtaUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mine = useQuery({
    queryKey: ["my-campaigns", userId],
    enabled: open && Boolean(userId),
    staleTime: 15_000,
    retry: false,
    queryFn: () => listMyCampaigns(),
  });

  if (!open) return null;

  const selected = PACKAGES.find((p) => p.id === pkg)!;
  const customImpressions =
    pkg === "custom" ? Math.round((Number(budget) || 0) * 0.1) : selected.impressions;
  const shownDays = pkg === "custom" ? `${Number(days) || 3} days` : selected.days;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await create({
        data: {
          postId: post.id,
          objective,
          package: pkg,
          budgetCents: pkg === "custom" ? Math.round((Number(budget) || 0) * 100) : 0,
          durationDays: pkg === "custom" ? Number(days) || 3 : 0,
          ctaLabel: ctaLabel.trim(),
          ctaUrl: ctaUrl.trim(),
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["my-campaigns", userId] });
      toast("Submitted for review — we'll notify you when it's live.");
      setTab("mine");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not submit. Run part5_ads.sql in Supabase first.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function act(id: string, action: "pause" | "resume" | "stop") {
    try {
      await updateMyCampaign({ data: { id, action } });
      await queryClient.invalidateQueries({ queryKey: ["my-campaigns", userId] });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Action failed.");
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Promote your content">
      <div className="space-y-4 pb-2">
        <div className="flex items-center gap-3 rounded-2xl bg-secondary p-2.5">
          {post.image_url ? (
            <img src={post.image_url} alt="" className="size-12 rounded-xl object-cover" />
          ) : (
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-border">
              <Megaphone className="size-5 text-muted-foreground" />
            </span>
          )}
          <p className="min-w-0 flex-1 truncate text-sm font-semibold">
            {post.caption.slice(0, 80) || "Untitled post"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {(["new", "mine"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-full py-2 text-sm font-bold",
                tab === t ? "bg-foreground text-background" : "bg-secondary text-foreground",
              )}
            >
              {t === "new" ? "New campaign" : "My campaigns"}
            </button>
          ))}
        </div>

        {tab === "new" ? (
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Objective</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {OBJECTIVES.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setObjective(o.id)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-bold",
                      objective === o.id
                        ? "bg-foreground text-background"
                        : "bg-secondary text-foreground",
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground">Package</p>
              <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                {PACKAGES.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPkg(p.id)}
                    className={cn(
                      "rounded-2xl border p-2.5 text-left",
                      pkg === p.id ? "border-foreground bg-secondary" : "border-border",
                    )}
                  >
                    <span className="block text-sm font-bold">{p.label}</span>
                    <span className="block text-xs text-muted-foreground">{p.price}</span>
                    <span className="block text-xs text-muted-foreground">
                      {p.id === "custom" ? p.days : `${p.days} · ±${p.impressions.toLocaleString()}`}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {pkg === "custom" && (
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Budget (TZS)
                  </span>
                  <input
                    value={budget}
                    onChange={(e) => setBudget(e.target.value.replace(/[^0-9]/g, ""))}
                    inputMode="numeric"
                    className="mt-1 w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Duration (days)
                  </span>
                  <input
                    value={days}
                    onChange={(e) => setDays(e.target.value.replace(/[^0-9]/g, ""))}
                    inputMode="numeric"
                    className="mt-1 w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm outline-none"
                  />
                </label>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground">CTA label</span>
                <input
                  value={ctaLabel}
                  onChange={(e) => setCtaLabel(e.target.value)}
                  maxLength={24}
                  placeholder="Learn more"
                  className="mt-1 w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm outline-none"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground">CTA link</span>
                <input
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  placeholder="shop.example.com"
                  className="mt-1 w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm outline-none"
                />
              </label>
            </div>

            <div className="rounded-2xl bg-secondary p-3 text-[13px]">
              <p className="font-bold">Review</p>
              <p className="mt-1 text-muted-foreground">
                {selected.label} · {shownDays} ·{" "}
                {pkg === "custom"
                  ? `TZS ${(Number(budget) || 0).toLocaleString()}`
                  : selected.price}
              </p>
              <p className="mt-0.5 text-muted-foreground">
                Estimated reach: {estimate(customImpressions)} — estimates, not guaranteed.
              </p>
            </div>

            {error && <p className="text-xs font-semibold text-live">{error}</p>}
            <button
              onClick={submit}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-2.5 text-sm font-bold text-background disabled:opacity-60"
            >
              {busy && <Loader2 className="size-4 animate-spin" />} Submit for approval
            </button>
            <p className="text-center text-[11px] text-muted-foreground">
              Goes live after review. Pause or stop anytime.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {mine.isPending && (
              <p className="text-sm text-muted-foreground">Loading campaigns…</p>
            )}
            {mine.data && mine.data.live === false && (
              <p className="text-sm text-muted-foreground">
                Campaign tables missing — run part5_ads.sql in Supabase, then pull to refresh.
              </p>
            )}
            {(mine.data?.campaigns ?? []).map((c) => (
              <div key={c.id} className="rounded-2xl border border-border p-3">
                <p className="truncate text-sm font-bold">{c.name || "Untitled campaign"}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {c.status} · {c.impressions} views · {c.clicks} clicks · {c.engagements} eng
                </p>
                <div className="mt-2 flex gap-1.5">
                  {c.status === "active" && (
                    <button
                      onClick={() => void act(c.id, "pause")}
                      className="rounded-full bg-secondary px-3 py-1.5 text-xs font-bold"
                    >
                      Pause
                    </button>
                  )}
                  {c.status === "paused" && (
                    <button
                      onClick={() => void act(c.id, "resume")}
                      className="rounded-full bg-secondary px-3 py-1.5 text-xs font-bold"
                    >
                      Resume
                    </button>
                  )}
                  {["active", "paused", "pending_review", "approved"].includes(c.status) && (
                    <button
                      onClick={() => void act(c.id, "stop")}
                      className="rounded-full bg-live/10 px-3 py-1.5 text-xs font-bold text-live"
                    >
                      Stop
                    </button>
                  )}
                </div>
              </div>
            ))}
            {mine.data?.live && (mine.data?.campaigns ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">
                No campaigns yet — create one above.
              </p>
            )}
          </div>
        )}
      </div>
    </Sheet>
  );
}
