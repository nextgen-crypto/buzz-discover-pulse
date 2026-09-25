import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function requireAdmin(context: unknown): void {
  const claims = (context as { claims?: { email?: string } }).claims;
  const email = claims?.email?.trim().toLowerCase();
  const allowed = (process.env["VITE_ADMIN_EMAILS"] ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  if (!email || !allowed.includes(email)) {
    throw new Error("Unauthorized: admin access required.");
  }
}

export interface AdminReport {
  id: string;
  kind: string;
  ref_id: string;
  ref_title: string;
  reporter_id: string;
  reporter_name: string;
  target_user_id: string | null;
  reason: string;
  details: string;
  status: string;
  resolution: string;
  created_at: string;
}

async function adminDb() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function isUuid(v: string | null | undefined): v is string {
  return (
    typeof v === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
  );
}

/** All reports, newest first. Requires SUPABASE_SERVICE_ROLE_KEY. */
export const fetchAdminReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(
    async ({
      context,
    }): Promise<{
      reports: AdminReport[];
      live: boolean;
    }> => {
      requireAdmin(context);
      try {
        const db = await adminDb();
        const { data, error } = await db
          .from("reports")
          .select(
            "id, kind, ref_id, ref_title, reporter_id, target_user_id, reason, details, status, resolution, created_at",
          )
          .order("created_at", { ascending: false })
          .limit(200);
        if (error) throw error;
        const rows = (data ?? []) as Omit<AdminReport, "reporter_name">[];
        const reporterIds = [...new Set(rows.map((r) => r.reporter_id))];
        const names = new Map<string, string>();
        if (reporterIds.length > 0) {
          const { data: profiles } = await db
            .from("profiles")
            .select("id, username")
            .in("id", reporterIds);
          for (const p of (profiles ?? []) as { id: string; username: string }[]) {
            names.set(p.id, p.username);
          }
        }
        return {
          live: true,
          reports: rows.map((r) => ({ ...r, reporter_name: names.get(r.reporter_id) ?? "?" })),
        };
      } catch {
        return { reports: [], live: false };
      }
    },
  );

export type ResolveAction =
  "approve" | "remove_content" | "delete_content" | "warn" | "restrict" | "suspend" | "unsuspend";

export const resolveAdminReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id?: string; action?: ResolveAction; note?: string } | undefined) => ({
    id: data?.id ?? "",
    action: data?.action ?? "approve",
    note: (data?.note ?? "").slice(0, 300),
  }))
  .handler(async ({ context, data }): Promise<{ ok: boolean; detail: string }> => {
    requireAdmin(context);
    const db = await adminDb();
    const { data: report, error } = await db
      .from("reports")
      .select("kind, ref_id, ref_title, reason, target_user_id")
      .eq("id", data.id)
      .maybeSingle();
    if (error || !report) throw new Error("Report not found.");
    const r = report as {
      kind: string;
      ref_id: string;
      ref_title: string;
      reason: string;
      target_user_id: string | null;
    };
    const labels: Record<ResolveAction, string> = {
      approve: "Approved — no violation",
      remove_content: "Content hidden",
      delete_content: "Content deleted",
      warn: "User warned",
      restrict: "User restricted",
      suspend: "User suspended",
      unsuspend: "User unsuspended",
    };
    let detail = data.note || labels[data.action];
    let contentGone = false;

    if (data.action === "delete_content") {
      if (r.kind === "post" && isUuid(r.ref_id)) {
        const { error: delError } = await db.from("posts").delete().eq("id", r.ref_id);
        if (delError) throw delError;
        contentGone = true;
      } else if (r.kind === "comment" && isUuid(r.ref_id)) {
        const { error: delError } = await db
          .from("comments")
          .update({ is_deleted: true })
          .eq("id", r.ref_id);
        if (delError) throw delError;
        contentGone = true;
      } else {
        detail = "Demo content — hidden locally instead (not a database row)";
      }
    }

    if (
      (data.action === "warn" || data.action === "restrict" || data.action === "suspend") &&
      isUuid(r.target_user_id)
    ) {
      if (data.action === "warn") {
        const { error: warnError } = await db.from("warnings").insert({
          user_id: r.target_user_id,
          message:
            data.note ||
            `Your ${r.kind} "${r.ref_title.slice(0, 60)}" was reported (${r.reason}). Please follow the community guidelines.`,
        });
        if (warnError) throw warnError;
      }
      // restrict/suspend are recorded in the resolution + audit trail;
      // hard enforcement lands with the roles system.
    }

    const { error: upError } = await db
      .from("reports")
      .update({ status: "resolved", resolution: detail })
      .eq("id", data.id);
    if (upError) throw upError;
    return { ok: true, detail: contentGone ? detail : detail };
  });

/** Send a warning straight to a user's inbox. */
export const sendUserWarning = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId?: string; message?: string } | undefined) => ({
    userId: data?.userId ?? "",
    message: (data?.message ?? "").slice(0, 300),
  }))
  .handler(async ({ context, data }): Promise<{ ok: boolean }> => {
    requireAdmin(context);
    if (!isUuid(data.userId)) throw new Error("Warnings need a real user account.");
    if (!data.message.trim()) throw new Error("Write the warning first.");
    const db = await adminDb();
    const { error } = await db
      .from("warnings")
      .insert({ user_id: data.userId, message: data.message.trim() });
    if (error) throw error;
    return { ok: true };
  });

// ------------------------------------------------------- advertising console
// Backend-driven campaign review. Reads/writes via service_role so admins can
// moderate any advertiser's campaign; the AdminScreen gates access client-side
// (desktop-only, VITE_ADMIN_EMAILS). Degrades to live:false when part5 tables
// are missing — the UI keeps the legacy local AdManager working.

export interface AdminCampaign {
  id: string;
  name: string;
  objective: string;
  status: string;
  package: string;
  budget_cents: number;
  spend_cents: number;
  currency: string;
  placement: string;
  impressions: number;
  clicks: number;
  engagements: number;
  hides: number;
  cta_label: string;
  advertiser_id: string;
  advertiser_name: string;
  post_id: string | null;
  post_caption: string;
  created_at: string;
}

export const fetchAdminCampaigns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ campaigns: AdminCampaign[]; live: boolean }> => {
    requireAdmin(context);
    try {
      const db = await adminDb();
      const { data, error } = await db
        .from("ad_campaigns")
        .select(
          "id, name, objective, status, package, budget_cents, spend_cents, currency, placement, impressions, clicks, engagements, hides, cta_label, advertiser_id, post_id, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      const rows = (data ?? []) as Omit<AdminCampaign, "advertiser_name" | "post_caption">[];
      const advIds = [...new Set(rows.map((r) => r.advertiser_id))];
      const postIds = [...new Set(rows.map((r) => r.post_id).filter((v): v is string => !!v))];
      const names = new Map<string, string>();
      const captions = new Map<string, string>();
      if (advIds.length > 0) {
        const { data: profiles } = await db
          .from("profiles")
          .select("id, username")
          .in("id", advIds);
        for (const p of (profiles ?? []) as { id: string; username: string }[]) {
          names.set(p.id, p.username);
        }
      }
      if (postIds.length > 0) {
        const { data: posts } = await db.from("posts").select("id, caption").in("id", postIds);
        for (const p of (posts ?? []) as { id: string; caption: string }[]) {
          captions.set(p.id, p.caption);
        }
      }
      return {
        live: true,
        campaigns: rows.map((r) => ({
          ...r,
          advertiser_name: names.get(r.advertiser_id) ?? "?",
          post_caption: r.post_id ? (captions.get(r.post_id) ?? "") : "",
        })),
      };
    } catch {
      return { campaigns: [], live: false };
    }
  });

export type CampaignReviewAction = "approve" | "reject" | "pause" | "resume" | "complete";

const CAMPAIGN_STATUS: Record<CampaignReviewAction, string> = {
  approve: "active",
  reject: "rejected",
  pause: "paused",
  resume: "active",
  complete: "completed",
};

export const reviewAdminCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { id?: string; action?: CampaignReviewAction; note?: string } | undefined) => ({
      id: data?.id ?? "",
      action: (data?.action ?? "approve") as CampaignReviewAction,
      note: (data?.note ?? "").slice(0, 300),
    }),
  )
  .handler(async ({ context, data }): Promise<{ ok: boolean }> => {
    requireAdmin(context);
    if (!isUuid(data.id)) throw new Error("Campaign not found.");
    if (!CAMPAIGN_STATUS[data.action]) throw new Error("Bad action.");
    const db = await adminDb();
    const patch =
      data.action === "reject"
        ? { status: "rejected" as const, rejection_reason: data.note }
        : { status: CAMPAIGN_STATUS[data.action] };
    const { error } = await db.from("ad_campaigns").update(patch).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
