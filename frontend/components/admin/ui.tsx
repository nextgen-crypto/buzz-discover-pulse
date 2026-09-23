import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Monochrome desktop admin primitives. Brand appears only in tiny dots. */
export function Panel({
  title,
  hint,
  right,
  children,
}: {
  title: string;
  hint?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
          {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

export function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
      <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function Badge({
  tone = "gray",
  children,
}: {
  tone?: "gray" | "dark" | "red" | "brand";
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold",
        tone === "gray" && "bg-secondary text-muted-foreground",
        tone === "dark" && "bg-foreground text-background",
        tone === "red" && "bg-live/10 text-live",
        tone === "brand" && "bg-brand-soft text-brand",
      )}
    >
      {children}
    </span>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
        checked ? "bg-foreground" : "bg-border",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 size-5 rounded-full bg-white shadow transition-all dark:bg-black",
          checked ? "left-[22px]" : "left-0.5",
        )}
      />
    </button>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export const inputCls =
  "w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-foreground";

export function Empty({ text }: { text: string }) {
  return <p className="py-6 text-center text-xs text-muted-foreground">{text}</p>;
}
