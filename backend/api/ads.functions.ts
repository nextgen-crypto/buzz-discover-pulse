import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const OBJECTIVES = [
  "reach",
  "engagement",
  "profile_visits",
  "followers",
  "website_visits",
  "product",
  "app_downloads",
  "event",
  "messages",
] as const;

const PACKAGES = ["starter", "growth", "business", "custom"] as const;

/** Default budgets (cents) + durations mirror ad_packages seed rows. */
const PACKAGE_DEFAULTS: Record<string, { budget: number; days: number }> = {
  starter: { budget: 1000000, days: 1 },
  growth: { budget: 2000000, days: 3 },
  business: { budget: 5000000, days: 7 },
  custom: { budget: 0, days: 3 },
};

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

async function adminDb() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/**
 * Promote an owned post. The campaign references the original post (no
 * duplicate) and starts at pending_review — admin approves before delivery.
 */
export const createCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data:
      | {
          postId?: string;
          objective?: string;
          package?: string;
          budgetCents?: number;
          durationDays?: number;
          ctaLabel?: string;
          ctaUrl?: string;
        }
      | undefined) => ({
      postId: data?.postId ?? "",
      objective: data?.objective ?? "reach",
      package: data?.package ?? "starter",
      budgetCents: typeof data?.budgetCents === "number" ? data.budgetCents : 0,
      durationDays: typeof data?.durationDays === "number" ? data.durationDays : 0,
      ctaLabel: (data?.ctaLabel ?? "").slice(0, 24),
      ctaUrl: (data?.ctaUrl ?? "").slice(0, 500),
    }),
  )
  .handler(async ({ context, data }): Promise<{ ok: boolean; id: string }> => {
    const me = (context as unknown as { userId: string }).userId;
    if (!isUuid(data.postId)) throw new Error("Pick one of your posts to promote.");
    if (!(OBJECTIVES as readonly string[]).includes(data.objective)) {
      throw new Error("Bad objective.");
    }
    if (!(PACKAGES as readonly string[]).includes(data.package)) {
      throw new Error("Bad package.");
    }
    const db = await adminDb();
    const { data: post, error: postError } = await db
      .from("posts")
      .select("id, caption")
      .eq("id", data.postId)
      .eq("author_id", me)
      .maybeSingle();
    if (postError || !post) throw new Error("Only your own posts can be promoted.");
    const defaults = PACKAGE_DEFAULTS[data.package] ?? PACKAGE_DEFAULTS.starter!;
    const days =
      data.package === "custom"
        ? Math.min(30, Math.max(1, Math.floor(data.durationDays) || 3))
        : defaults.days;
    const budget =
      data.package === "custom"
        ? Math.min(100_000_000, Math.max(0, Math.floor(data.budgetCents)))
        : defaults.budget;
    const now = Date.now();
    const { data: inserted, error } = await db
      .from("ad_campaigns")
      .insert({
        advertiser_id: me,
        post_id: data.postId,
        name: ((post as { caption: string }).caption ?? "").slice(0, 80),
        objective: data.objective,
        status: "pending_review",
        package: data.package,
        budget_cents: budget,
        currency: "TZS",
        placement: "feed",
        frequency_every_n: 5,
        frequency_cap_per_day: 3,
        starts_at: new Date(now).toISOString(),
        ends_at: new Date(now + days * 86_400_000).toISOString(),
        targeting: {},
        cta_label: data.ctaLabel,
        cta_url:
          data.ctaUrl && !/^https?:\/\//i.test(data.ctaUrl) ? `https://${data.ctaUrl}` : data.ctaUrl,
        metadata: {},
      })
      .select("id")
      .single();
    if (error || !inserted) throw new Error(error?.message ?? "Could not create campaign.");
    return { ok: true as const, id: (inserted as { id: string }).id };
  });

export interface MyCampaign {
  id: string;
  name: string;
  objective: string;
  status: string;
  package: string;
  budget_cents: number;
  spend_cents: number;
  currency: string;
  impressions: number;
  clicks: number;
  engagements: number;
  created_at: string;
  ends_at: string | null;
}

export const listMyCampaigns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ campaigns: MyCampaign[]; live: boolean }> => {
    try {
      const me = (context as unknown as { userId: string }).userId;
      const { supabase } = context as unknown as {
        supabase: ReturnType<typeof import("@/integrations/supabase/client.server").supabaseAdmin>;
      };
      const { data, error } = await supabase
        .from("ad_campaigns")
        .select(
          "id, name, objective, status, package, budget_cents, spend_cents, currency, impressions, clicks, engagements, created_at, ends_at",
        )
        .eq("advertiser_id", me)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return { campaigns: (data ?? []) as MyCampaign[], live: true };
    } catch {
      return { campaigns: [], live: false };
    }
  });

export const updateMyCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id?: string; action?: string } | undefined) => ({
    id: data?.id ?? "",
    action: data?.action ?? "",
  }))
  .handler(async ({ context, data }): Promise<{ ok: boolean }> => {
    const me = (context as unknown as { userId: string }).userId;
    if (!isUuid(data.id)) throw new Error("Campaign not found.");
    const status =
      data.action === "pause" ? "paused" : data.action === "resume" ? "active" : null;
    const stop = data.action === "stop";
    if (!status && !stop) throw new Error("Bad action.");
    const db = await adminDb();
    const { data: row, error: fetchError } = await db
      .from("ad_campaigns")
      .select("advertiser_id")
      .eq("id", data.id)
      .maybeSingle();
    if (fetchError || !row || (row as { advertiser_id: string }).advertiser_id !== me) {
      throw new Error("Campaign not found.");
    }
    const { error } = await db
      .from("ad_campaigns")
      .update({ status: stop ? "cancelled" : (status as string) })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true as const };
  });

export interface Promotion {
  campaignId: string;
  objective: string;
  ctaLabel: string;
  ctaUrl: string;
  post: { id: string; caption: string; image_url: string | null; created_at: string };
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    verified: boolean;
  };
}

/** Active campaigns + their posts for feed injection. Public, live:false when tables miss. */
export const fetchActivePromotions = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ promotions: Promotion[]; live: boolean }> => {
    try {
      const db = await adminDb();
      const { data, error } = await db
        .from("ad_campaigns")
        .select("id, objective, cta_label, cta_url, post_id, advertiser_id")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      const rows = (data ?? []) as {
        id: string;
        objective: string;
        cta_label: string;
        cta_url: string;
        post_id: string | null;
        advertiser_id: string;
      }[];
      const postIds = [...new Set(rows.map((r) => r.post_id).filter((v): v is string => !!v))];
      const advIds = [...new Set(rows.map((r) => r.advertiser_id))];
      if (postIds.length === 0 || advIds.length === 0) return { promotions: [], live: true };
      const [{ data: posts }, { data: profiles }] = await Promise.all([
        db.from("posts").select("id, caption, image_url, author_id, created_at").in("id", postIds),
        db
          .from("profiles")
          .select("id, username, display_name, avatar_url, verified")
          .in("id", advIds),
      ]);
      const postById = new Map(
        ((posts ?? []) as {
          id: string;
          caption: string;
          image_url: string | null;
          author_id: string;
          created_at: string;
        }[]).map((p) => [p.id, p]),
      );
      const profById = new Map(
        ((profiles ?? []) as {
          id: string;
          username: string;
          display_name: string;
          avatar_url: string | null;
          verified: boolean;
        }[]).map((p) => [p.id, p]),
      );
      const promotions: Promotion[] = [];
      for (const r of rows) {
        const p = r.post_id ? postById.get(r.post_id) : undefined;
        const a = profById.get(r.advertiser_id);
        if (!p || !a) continue;
        promotions.push({
          campaignId: r.id,
          objective: r.objective,
          ctaLabel: r.cta_label ?? "",
          ctaUrl: r.cta_url ?? "",
          post: { id: p.id, caption: p.caption, image_url: p.image_url, created_at: p.created_at },
          author: {
            id: a.id,
            username: a.username,
            displayName: a.display_name,
            avatarUrl: a.avatar_url,
            verified: a.verified,
          },
        });
      }
      return { promotions, live: true };
    } catch {
      return { promotions: [], live: false };
    }
  },
);

const EVENT_KINDS = [
  "impression",
  "click",
  "like",
  "comment",
  "share",
  "save",
  "follow",
  "profile_visit",
  "hide",
  "report",
] as const;

/** Viewer-side event log + frequency-cap bookkeeping. Silent no-op on failure. */
export const logAdEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { campaignId?: string; kind?: string } | undefined) => ({
    campaignId: data?.campaignId ?? "",
    kind: data?.kind ?? "impression",
  }))
  .handler(async ({ context, data }): Promise<{ ok: boolean }> => {
    try {
      const me = (context as unknown as { userId: string }).userId;
      if (!isUuid(data.campaignId)) return { ok: true as const };
      if (!(EVENT_KINDS as readonly string[]).includes(data.kind)) {
        return { ok: true as const };
      }
      const db = await adminDb();
      await db.from("ad_events").insert({ campaign_id: data.campaignId, viewer_id: me, kind: data.kind });
      const { data: existing } = await db
        .from("ad_exposures")
        .select("impression_count, interaction_count")
        .eq("campaign_id", data.campaignId)
        .eq("viewer_id", me)
        .maybeSingle();
      const prev = (existing ?? { impression_count: 0, interaction_count: 0 }) as {
        impression_count: number;
        interaction_count: number;
      };
      const isImpression = data.kind === "impression";
      const isHide = data.kind === "hide" || data.kind === "report";
      await db.from("ad_exposures").upsert(
        {
          campaign_id: data.campaignId,
          viewer_id: me,
          last_shown_at: new Date().toISOString(),
          impression_count: prev.impression_count + (isImpression ? 1 : 0),
          interaction_count:
            prev.interaction_count + (isImpression || isHide ? 0 : 1),
          hidden: isHide ? true : false,
        },
        { onConflict: "campaign_id, viewer_id" },
      );
    } catch {
      // Feed must never break on analytics failure.
    }
    return { ok: true as const };
  });
