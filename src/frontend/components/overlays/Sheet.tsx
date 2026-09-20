import { useEffect, useState, type ReactNode } from "react";
import { Maximize2, Minimize2, X } from "lucide-react";

/**
 * Lightweight bottom sheet / overlay.
 * Bottom sheets open at half height and can be expanded to cover the whole screen
 * by tapping the grabber, the expand button, or dragging upwards.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  side = "bottom",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  side?: "bottom" | "left" | "top";
}) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!open) setExpanded(false);
  }, [open]);

  if (!open) return null;

  const isBottom = side === "bottom";

  const panel = isBottom
    ? expanded
      ? "absolute inset-x-0 bottom-0 top-0 rounded-none sm:inset-x-4 sm:top-4 sm:rounded-t-3xl"
      : "absolute inset-x-0 bottom-0 max-h-[65dvh] rounded-t-3xl sm:inset-x-4 sm:max-h-[70dvh]"
    : side === "top"
      ? "absolute inset-x-0 top-0 rounded-b-3xl"
      : "absolute inset-y-0 left-0 w-[78%] max-w-[320px]";

  return (
    <div className="fixed inset-0 z-50 mx-auto w-full max-w-3xl" role="dialog" aria-label={title}>
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-scrim backdrop-blur-[2px]"
      />
      <div
        className={`${panel} flex flex-col border border-border bg-background p-4 pb-safe shadow-raise transition-all duration-200 sm:p-5`}
      >
        {isBottom && (
          <button
            aria-label={expanded ? "Collapse sheet" : "Expand sheet to full screen"}
            onClick={() => setExpanded((v) => !v)}
            onTouchStart={(e) => {
              const startY = e.touches[0]?.clientY ?? 0;
              const onEnd = (ev: TouchEvent) => {
                const endY = ev.changedTouches[0]?.clientY ?? startY;
                if (startY - endY > 40) setExpanded(true);
                if (endY - startY > 40) setExpanded(false);
                window.removeEventListener("touchend", onEnd);
              };
              window.addEventListener("touchend", onEnd);
            }}
            className="mx-auto -mt-1 mb-2 h-6 w-full max-w-24 shrink-0"
          >
            <span className="mx-auto block h-1.5 w-12 rounded-full bg-border" />
          </button>
        )}
        <div className="flex shrink-0 items-center justify-between pb-3">
          <h2 className="text-base font-bold tracking-tight text-foreground">{title}</h2>
          <div className="flex items-center gap-1">
            {isBottom && (
              <button
                aria-label={expanded ? "Collapse sheet" : "Full screen"}
                onClick={() => setExpanded((v) => !v)}
                className="rounded-full p-1.5 hover:bg-secondary"
              >
                {expanded ? (
                  <Minimize2 className="size-4 text-muted-foreground" />
                ) : (
                  <Maximize2 className="size-4 text-muted-foreground" />
                )}
              </button>
            )}
            <button aria-label="Close" onClick={onClose} className="rounded-full p-1.5 hover:bg-secondary">
              <X className="size-4 text-muted-foreground" />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
