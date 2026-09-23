import { useEffect, useRef, useState, type ReactNode } from "react";

const EXPAND_SWIPE = -70;
const COLLAPSE_SWIPE = 110;

/**
 * Lightweight bottom sheet / overlay.
 * No chrome buttons: pull the grabber (or header) up to go full screen,
 * pull down to collapse — pull down again (or tap the scrim) to close.
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
  const panelRef = useRef<HTMLDivElement | null>(null);
  const drag = useRef({ startY: 0, dy: 0, dragging: false, moved: false });

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

  function setPanelShift(dy: number | null) {
    const el = panelRef.current;
    if (!el) return;
    if (dy === null) {
      el.style.transition = "";
      el.style.transform = "";
    } else {
      el.style.transition = "none";
      el.style.transform = `translateY(${dy}px)`;
    }
  }

  function onDragStart(e: React.PointerEvent<HTMLDivElement>) {
    if (!isBottom || e.isPrimary === false) return;
    drag.current = { startY: e.clientY, dy: 0, dragging: true, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onDragMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d.dragging) return;
    const dy = e.clientY - d.startY;
    d.dy = dy;
    if (Math.abs(dy) > 8) d.moved = true;
    // Resistance pulling past the top; free travel downward.
    setPanelShift(expanded ? Math.max(-60, dy) : Math.max(-160, dy));
  }

  function onDragEnd() {
    const d = drag.current;
    if (!d.dragging) return;
    d.dragging = false;
    setPanelShift(null);
    if (!d.moved) return;
    if (expanded) {
      if (d.dy > COLLAPSE_SWIPE) setExpanded(false);
    } else {
      if (d.dy < EXPAND_SWIPE) setExpanded(true);
      else if (d.dy > COLLAPSE_SWIPE) onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 mx-auto w-full max-w-3xl" role="dialog" aria-label={title}>
      <button
        aria-label="Close"
        onClick={onClose}
        className="animate-scrim-in absolute inset-0 bg-scrim backdrop-blur-[2px]"
      />
      <div
        ref={panelRef}
        className={`${panel} animate-sheet-in flex flex-col border border-border bg-background p-4 pb-safe shadow-raise transition-all duration-200 sm:p-5`}
      >
        {isBottom && (
          <div
            onPointerDown={onDragStart}
            onPointerMove={onDragMove}
            onPointerUp={onDragEnd}
            onPointerCancel={onDragEnd}
            className="shrink-0 touch-none select-none"
          >
            <button
              aria-label={expanded ? "Collapse sheet" : "Expand sheet to full screen"}
              onClick={() => {
                if (!drag.current.moved) setExpanded((v) => !v);
                drag.current.moved = false;
              }}
              className="mx-auto -mt-1 mb-2 flex h-6 w-full max-w-24 items-center justify-center"
            >
              <span className="block h-1.5 w-12 rounded-full bg-border" />
            </button>
            <div className="flex shrink-0 items-center justify-between pb-3">
              <h2 className="text-base font-bold tracking-tight text-foreground">{title}</h2>
            </div>
          </div>
        )}
        {!isBottom && (
          <div className="flex shrink-0 items-center justify-between pb-3">
            <h2 className="text-base font-bold tracking-tight text-foreground">{title}</h2>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
