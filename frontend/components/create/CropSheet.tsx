import { useEffect, useRef, useState } from "react";
import { Check, Crop as CropIcon, RotateCcw } from "lucide-react";
import { Sheet } from "@/frontend/components/overlays/Sheet";
import { cn } from "@/lib/utils";

type AspectId = "free" | "1:1" | "4:5" | "16:9" | "9:16";

const ASPECTS: { id: AspectId; label: string; ratio: number | null }[] = [
  { id: "free", label: "Free", ratio: null },
  { id: "1:1", label: "1:1", ratio: 1 },
  { id: "4:5", label: "4:5", ratio: 4 / 5 },
  { id: "16:9", label: "16:9", ratio: 16 / 9 },
  { id: "9:16", label: "9:16", ratio: 9 / 16 },
];

/**
 * Crop any post image before publishing: drag to position, slider to zoom,
 * aspect presets (or free). Outputs a fresh JPEG File — the original picked
 * file is replaced, never modified in place.
 */
export function CropSheet({
  open,
  onClose,
  imageSrc,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  imageSrc: string;
  onDone: (file: File) => void;
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [stage, setStage] = useState({ w: 0, h: 0 });
  const [aspect, setAspect] = useState<AspectId>("free");
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setAspect("free");
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setNatural(null);
    setError(null);
    const img = new Image();
    img.onload = () => setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => setError("Could not load that image.");
    img.src = imageSrc;
  }, [open, imageSrc]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el || !open) return;
    const measure = () => setStage({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open ]);

  if (!open) return null;

  const ratio =
    ASPECTS.find((a) => a.id === aspect)?.ratio ??
    (natural ? natural.w / natural.h : 4 / 5);

  // Largest centered box of `ratio` that fits the stage.
  let boxW = stage.w;
  let boxH = stage.w / ratio;
  if (boxH > stage.h) {
    boxH = stage.h;
    boxW = stage.h * ratio;
  }

  const base = natural ? Math.max(boxW / natural.w, boxH / natural.h) : 1;
  const scale = base * zoom;
  const dw = natural ? natural.w * scale : 0;
  const dh = natural ? natural.h * scale : 0;
  const maxX = Math.max(0, (dw - boxW) / 2);
  const maxY = Math.max(0, (dh - boxH) / 2);
  const ox = Math.min(maxX, Math.max(-maxX, offset.x));
  const oy = Math.min(maxY, Math.max(-maxY, offset.y));

  function onPointerDown(e: React.PointerEvent) {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    setOffset({ x: d.ox + (e.clientX - d.x), y: d.oy + (e.clientY - d.y) });
  }
  function onPointerUp() {
    drag.current = null;
  }

  async function apply() {
    if (!natural) return;
    setSaving(true);
    setError(null);
    try {
      const cx = stage.w / 2;
      const cy = stage.h / 2;
      const imgLeft = cx + ox - dw / 2;
      const imgTop = cy + oy - dh / 2;
      const boxL = cx - boxW / 2;
      const boxT = cy - boxH / 2;
      let sx = Math.round((boxL - imgLeft) / scale);
      let sy = Math.round((boxT - imgTop) / scale);
      let sw = Math.round(boxW / scale);
      let sh = Math.round(boxH / scale);
      sx = Math.min(Math.max(0, sx), natural.w - 1);
      sy = Math.min(Math.max(0, sy), natural.h - 1);
      sw = Math.min(sw, natural.w - sx);
      sh = Math.min(sh, natural.h - sy);
      if (sw < 8 || sh < 8) throw new Error("Zoom out a little first.");
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("Could not load that image."));
        el.src = imageSrc;
      });
      const canvas = document.createElement("canvas");
      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Crop unavailable on this device.");
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.92),
      );
      if (!blob) throw new Error("Could not crop that image.");
      onDone(new File([blob], `crop-${Date.now()}.jpg`, { type: "image/jpeg" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not crop.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Crop photo">
      <div className="space-y-3 pb-2">
        <div
          ref={stageRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="relative h-80 w-full touch-none select-none overflow-hidden rounded-2xl bg-surface-strong"
        >
          {natural && stage.w > 0 && (
            <>
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop preview"
                draggable={false}
                className="absolute max-w-none"
                style={{
                  width: dw,
                  height: dh,
                  left: stage.w / 2 + ox - dw / 2,
                  top: stage.h / 2 + oy - dh / 2,
                }}
              />
              <div
                className="absolute border-2 border-white"
                style={{
                  width: boxW,
                  height: boxH,
                  left: (stage.w - boxW) / 2,
                  top: (stage.h - boxH) / 2,
                  boxShadow: "0 0 0 999px rgba(0,0,0,0.55)",
                }}
              >
                <span className="absolute inset-y-0 left-1/3 w-px bg-white/60" />
                <span className="absolute inset-y-0 left-2/3 w-px bg-white/60" />
                <span className="absolute inset-x-0 top-1/3 h-px bg-white/60" />
                <span className="absolute inset-x-0 top-2/3 h-px bg-white/60" />
              </div>
            </>
          )}
          {!natural && !error && (
            <p className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
              Loading…
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {ASPECTS.map((a) => (
            <button
              key={a.id}
              onClick={() => {
                setAspect(a.id);
                setZoom(1);
                setOffset({ x: 0, y: 0 });
              }}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-bold",
                aspect === a.id
                  ? "bg-foreground text-background"
                  : "bg-secondary text-foreground",
              )}
            >
              {a.label}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-3 px-1">
          <CropIcon className="size-4 shrink-0 text-muted-foreground" />
          <input
            type="range"
            min={100}
            max={300}
            value={Math.round(zoom * 100)}
            onChange={(e) => setZoom(Number(e.target.value) / 100)}
            className="w-full"
            aria-label="Zoom"
          />
          <button
            onClick={() => {
              setZoom(1);
              setOffset({ x: 0, y: 0 });
            }}
            aria-label="Reset crop"
            className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary"
          >
            <RotateCcw className="size-4" />
          </button>
        </label>

        {error && <p className="text-xs font-semibold text-live">{error}</p>}
        <button
          onClick={apply}
          disabled={saving || !natural}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-2.5 text-sm font-bold text-background disabled:opacity-60"
        >
          <Check className="size-4" /> {saving ? "Cropping…" : "Apply crop"}
        </button>
        <p className="text-center text-[11px] text-muted-foreground">
          Drag to position · cropping saves a still JPEG (GIFs become stills).
        </p>
      </div>
    </Sheet>
  );
}
