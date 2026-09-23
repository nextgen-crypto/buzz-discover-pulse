import { useState } from "react";
import { Flag } from "lucide-react";
import { Sheet } from "@/frontend/components/overlays/Sheet";
import { useSession } from "@/frontend/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const REPORT_REASONS = [
  "Spam",
  "Harassment",
  "Hate speech",
  "Violence",
  "Nudity",
  "Copyright",
  "Impersonation",
  "Other",
] as const;

export interface ReportTarget {
  kind: "post" | "video" | "comment" | "user" | "short" | "story" | "article";
  refId: string;
  refTitle: string;
  targetUserId?: string;
}

/** File a report. Signed-in only; arrives in the live admin queue. */
export function ReportDialog({
  open,
  onClose,
  target,
}: {
  open: boolean;
  onClose: (filed: boolean) => void;
  target: ReportTarget;
}) {
  const { user } = useSession();
  const [reason, setReason] = useState<string>(REPORT_REASONS[0]!);
  const [details, setDetails] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!user) {
      setError("Sign in to report.");
      return;
    }
    setSaving(true);
    setError(null);
    const { error: err } = await supabase.from("reports").insert({
      reporter_id: user.id,
      kind: target.kind,
      ref_id: target.refId,
      ref_title: target.refTitle.slice(0, 120),
      target_user_id: target.targetUserId ?? null,
      reason,
      details: details.trim().slice(0, 500),
    });
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setDone(true);
    window.setTimeout(() => {
      setDone(false);
      setDetails("");
      onClose(true);
    }, 900);
  }

  return (
    <Sheet open={open} onClose={() => onClose(false)} title="Report">
      {done ? (
        <div className="px-2 py-8 text-center">
          <p className="text-[15px] font-bold">Thanks — report filed</p>
          <p className="mt-1 text-xs text-muted-foreground">Our moderators review every report.</p>
        </div>
      ) : (
        <div className="space-y-3 pb-2">
          <p className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
            <Flag className="size-3.5" /> {target.kind} · {target.refTitle.slice(0, 60)}
          </p>
          <div className="flex flex-wrap gap-1.5 px-1">
            {REPORT_REASONS.map((r) => (
              <button
                key={r}
                onClick={() => setReason(r)}
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-semibold",
                  reason === r ? "bg-foreground text-background" : "bg-secondary text-foreground",
                )}
              >
                {r}
              </button>
            ))}
          </div>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="What happened? (optional)"
            className="w-full resize-none rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-brand"
          />
          {error && <p className="text-xs font-semibold text-live">{error}</p>}
          <button
            onClick={submit}
            disabled={saving}
            className="w-full rounded-full bg-brand py-2.5 text-sm font-bold text-brand-foreground disabled:opacity-60"
          >
            {saving ? "Filing…" : "File report"}
          </button>
        </div>
      )}
    </Sheet>
  );
}
