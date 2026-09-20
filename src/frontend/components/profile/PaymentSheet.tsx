import { BadgeCheck, Crown, HeartHandshake, ShieldCheck, Wallet, Zap } from "lucide-react";
import { Sheet } from "@/frontend/components/overlays/Sheet";

/** Reasons a payment matters on WIZZ, shown inside the payment sheet. */
const reasons = [
  {
    Icon: HeartHandshake,
    title: "Support creators directly",
    body: "Send a tip to reward the people whose posts, clips and videos you love.",
  },
  {
    Icon: Crown,
    title: "Unlock WIZZ Premium",
    body: "Go ad-free, get a premium badge, and post longer videos and clips.",
  },
  {
    Icon: Zap,
    title: "Boost your reach",
    body: "Promote a post so it appears in more feeds, trending lists and searches.",
  },
  {
    Icon: ShieldCheck,
    title: "Safe and secure",
    body: "Payments are processed by a trusted provider — your card details never touch WIZZ.",
  },
];

export function PaymentSheet({
  open,
  onClose,
  creatorName,
}: {
  open: boolean;
  onClose: () => void;
  /** When set, the sheet is framed as supporting this creator (public profiles). */
  creatorName?: string | null;
}) {
  return (
    <Sheet open={open} onClose={onClose} title={creatorName ? `Support ${creatorName}` : "Payments"}>
      <div className="space-y-4 pb-2">
        <div className="flex items-center gap-3 rounded-2xl bg-brand-soft p-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand">
            <Wallet className="size-5 text-brand-foreground" />
          </span>
          <div>
            <p className="text-sm font-bold text-foreground">
              {creatorName ? `Tip ${creatorName}` : "Why pay on WIZZ?"}
            </p>
            <p className="text-xs text-muted-foreground">
              {creatorName
                ? "Your tip goes straight to this creator to keep them posting."
                : "Payments keep WIZZ running and reward the creators you love."}
            </p>
          </div>
        </div>

        <ul className="space-y-3">
          {reasons.map(({ Icon, title, body }) => (
            <li key={title} className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary">
                <Icon className="size-4.5 text-brand" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-xs leading-snug text-muted-foreground">{body}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="rounded-2xl border border-border p-3 text-center">
          <p className="flex items-center justify-center gap-1.5 text-xs font-semibold text-foreground">
            <BadgeCheck className="size-4 text-brand" /> Checkout coming soon
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Secure checkout is being set up. Once live, this button will open card and mobile-money
            payment options.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-full bg-brand py-3 text-sm font-bold text-brand-foreground"
        >
          Got it
        </button>
      </div>
    </Sheet>
  );
}
