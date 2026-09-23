import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAdminCampaigns,
  reviewAdminCampaign,
  type CampaignReviewAction,
} from "@/backend/api/admin.functions";
import { Badge, Empty, Panel } from "@/frontend/components/admin/ui";

function Stat2({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className="rounded-2xl bg-secondary p-3">
      <p className={`text-xl font-bold ${alert ? "text-live" : "text-foreground"}`}>{value}</p>
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function ActionBtn({
  label,
  onClick,
  danger,
  disabled,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full px-3 py-1.5 text-xs font-bold disabled:opacity-50 ${
        danger ? "bg-live/10 text-live" : "bg-secondary text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

/**
 * Backend-driven campaign console (Supabase ad_campaigns via service_role).
 * Graceful when part5 tables are missing: shows a setup hint and renders
 * nothing else — the legacy local AdManager below keeps working.
 */
export function CampaignConsole() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-campaigns-live"],
    queryFn: () => fetchAdminCampaigns(),
    staleTime: 15_000,
    retry: false,
  });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Panel title="Campaigns">
        <Empty text="Loading live campaigns…" />
      </Panel>
    );
  }
  if (!data || data.live === false) {
    return (
      <Panel
        title="Campaigns"
        hint="Run 20260921170500_part5_ads.sql in the Supabase SQL editor to bring live campaigns online."
      >
        <Empty text="Live tables missing — local ads below keep working." />
      </Panel>
    );
  }

  const campaigns = data.campaigns;
  const pending = campaigns.filter((c) => c.status === "pending_review").length;
  const active = campaigns.filter((c) => c.status === "active").length;
  const impressions = campaigns.reduce((s, c) => s + c.impressions, 0);

  async function review(id: string, action: CampaignReviewAction) {
    setBusyId(id);
    setError(null);
    try {
      const note =
        action === "reject" ? window.prompt("Rejection reason (optional):", "") ?? "" : "";
      await reviewAdminCampaign({ data: { id, action, note: note.slice(0, 300) } });
      await queryClient.invalidateQueries({ queryKey: ["admin-campaigns-live"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Stat2 label="Pending review" value={`${pending}`} alert={pending > 0} />
        <Stat2 label="Active" value={`${active}`} />
        <Stat2 label="Impressions" value={`${impressions}`} />
      </div>
      <Panel
        title={`Campaigns (${campaigns.length})`}
        hint="Review → approve, reject, pause, resume, complete"
      >
        {error && <p className="mb-2 text-xs font-semibold text-live">{error}</p>}
        {campaigns.length === 0 ? (
          <Empty text="No campaigns yet. Owner Promote actions will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-[13px]">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2 pr-3">Campaign</th>
                  <th className="pb-2 pr-3">Advertiser</th>
                  <th className="pb-2 pr-3">Status</th>
                  <th className="pb-2 pr-3">Delivery</th>
                  <th className="pb-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {campaigns.map((c) => {
                  const busy = busyId === c.id;
                  return (
                    <tr key={c.id}>
                      <td className="py-2 pr-3">
                        <p className="font-semibold">
                          {c.name || c.post_caption.slice(0, 60) || "Untitled campaign"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {c.objective} · {c.package} · {(c.budget_cents / 100).toLocaleString()}{" "}
                          {c.currency}
                        </p>
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground">@{c.advertiser_name}</td>
                      <td className="py-2 pr-3">
                        <Badge tone={c.status === "pending_review" ? "red" : "gray"}>
                          {c.status}
                        </Badge>
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground">
                        {c.impressions} views · {c.clicks} clicks · {c.engagements} eng
                      </td>
                      <td className="py-2">
                        <span className="flex flex-wrap gap-1">
                          {(c.status === "pending_review" || c.status === "pending_payment") && (
                            <ActionBtn
                              label={busy ? "…" : "Approve"}
                              disabled={busy}
                              onClick={() => void review(c.id, "approve")}
                            />
                          )}
                          {(c.status === "pending_review" || c.status === "active") && (
                            <ActionBtn
                              label="Reject"
                              danger
                              disabled={busy}
                              onClick={() => void review(c.id, "reject")}
                            />
                          )}
                          {c.status === "active" && (
                            <ActionBtn
                              label="Pause"
                              disabled={busy}
                              onClick={() => void review(c.id, "pause")}
                            />
                          )}
                          {c.status === "paused" && (
                            <ActionBtn
                              label={busy ? "…" : "Resume"}
                              disabled={busy}
                              onClick={() => void review(c.id, "resume")}
                            />
                          )}
                          {(c.status === "active" || c.status === "paused") && (
                            <ActionBtn
                              label="Complete"
                              danger
                              disabled={busy}
                              onClick={() => void review(c.id, "complete")}
                            />
                          )}
                          {!["pending_review", "pending_payment", "active", "paused"].includes(
                            c.status,
                          ) && <span className="text-xs text-muted-foreground">done</span>}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
