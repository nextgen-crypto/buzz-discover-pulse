import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  Loader2,
  Music,
  Radio,
  RefreshCw,
  Square,
  Timer,
  Type,
  X,
  Zap,
} from "lucide-react";
import {
  defaultBeauty,
  filterCss,
  filterPresets,
  type BeautySettings,
  type FilterPreset,
} from "@/frontend/components/camera/beautyFilters";
import { TRACKS } from "@/frontend/components/create/creationEngine";

export type CameraMode = "photo" | "short" | "live";

interface Props {
  open: boolean;
  mode: CameraMode;
  onClose: () => void;
  /** Photo mode: the beautified still. Short mode: the recorded clip. */
  onCapture?: (file: File) => void;
}

const titles: Record<CameraMode, string> = {
  photo: "Photo with filters",
  short: "Record a short",
  live: "Go live",
};

export function BeautyCameraSheet({ open, mode, onClose, onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [preset, setPreset] = useState<FilterPreset>(filterPresets[1] ?? filterPresets[0]!);
  const [custom, setCustom] = useState<BeautySettings>(defaultBeauty);
  const [useCustom, setUseCustom] = useState(false);
  const [strength, setStrength] = useState(1);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState(false);

  // Right-edge toolbar state — flat glyphs, no plates.
  const [flash, setFlash] = useState<"off" | "on" | "auto">("off");
  const [timerSecs, setTimerSecs] = useState<0 | 3 | 10 | 15>(15);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flashFire, setFlashFire] = useState(false);
  const [textMode, setTextMode] = useState(false);
  const [overlayText, setOverlayText] = useState("");
  const [musicOpen, setMusicOpen] = useState(false);
  const [trackId, setTrackId] = useState<string | null>(null);
  const track = TRACKS.find((t) => t.id === trackId) ?? null;

  const settings = useCustom ? custom : preset.settings;
  const css = filterCss(settings, useCustom ? undefined : preset.extra, strength);

  const stop = useCallback(() => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setReady(false);
    setRecording(false);
    setSeconds(0);
  }, []);

  useEffect(() => {
    if (!open) {
      stop();
      return;
    }
    let cancelled = false;
    setError(null);
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: facing }, audio: mode !== "photo" })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
        setReady(true);
      })
      .catch(() => setError("Camera access was blocked. Allow the camera to use face filters."));
    return () => {
      cancelled = true;
      stop();
    };
  }, [open, facing, mode, stop]);

  useEffect(() => {
    if (!recording) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [recording]);

  useEffect(() => {
    if (recording && seconds >= 60) stopRecording();
  }, [seconds, recording]);

  async function takePhoto() {
    const video = videoRef.current;
    if (!video || busy || countdown !== null) return;
    if (timerSecs > 0) {
      for (let n = timerSecs; n >= 1; n--) {
        setCountdown(n);
        await new Promise((res) => setTimeout(res, n > 3 ? 250 : 1000));
      }
      setCountdown(null);
    }
    if (flash !== "off") {
      setFlashFire(true);
      window.setTimeout(() => setFlashFire(false), 220);
    }
    setBusy(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.filter = css;
      if (facing === "user") {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      if (flash === "on") {
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      if (textMode && overlayText.trim()) {
        ctx.font = `700 ${Math.round(canvas.height * 0.055)}px system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.shadowColor = "rgba(0,0,0,0.55)";
        ctx.shadowBlur = 12;
        ctx.fillStyle = "#fff";
        ctx.fillText(overlayText.trim(), canvas.width / 2, canvas.height / 2, canvas.width * 0.9);
      }
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.92));
      if (!blob) return;
      onCapture?.(new File([blob], `wizz-${Date.now()}.jpg`, { type: "image/jpeg" }));
      onClose();
    } finally {
      setBusy(false);
    }
  }

  function startRecording() {
    const stream = streamRef.current;
    if (!stream) return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" });
      onCapture?.(new File([blob], `wizz-short-${Date.now()}.webm`, { type: blob.type }));
      onClose();
    };
    recorderRef.current = recorder;
    recorder.start();
    setRecording(true);
    setSeconds(0);
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    setRecording(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-media">
      <div className="flex items-center justify-between px-4 pt-safe">
        <button
          aria-label="Close camera"
          onClick={onClose}
          className="grid size-10 place-items-center rounded-full bg-scrim"
        >
          <X className="size-5 text-media-foreground" />
        </button>
        <span className="text-sm font-semibold text-media-foreground">{titles[mode]}</span>
        <span className="grid size-10 place-items-center">
          {flash !== "off" && <Zap className="size-4 text-white" fill="currentColor" />}
        </span>
      </div>

      <div className="relative mt-3 flex-1 overflow-hidden">
        <video
          ref={videoRef}
          playsInline
          muted
          className="size-full object-cover"
          style={{ filter: css, transform: facing === "user" ? "scaleX(-1)" : undefined }}
        />
        {/* Flash fire */}
        {flashFire && <div className="pointer-events-none absolute inset-0 bg-white/70" />}
        {/* Countdown */}
        {countdown !== null && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <span
              key={countdown}
              className="animate-scale-in text-7xl font-black text-white drop-shadow-lg"
            >
              {countdown}
            </span>
          </div>
        )}
        {/* Text overlay preview */}
        {textMode && overlayText.trim() && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center p-8">
            <p className="text-center text-2xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
              {overlayText.trim()}
            </p>
          </div>
        )}
        {/* Far-right floating toolbar: flat white glyphs, labels, no plates */}
        <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 flex-col items-center gap-4">
          <button
            aria-label="Flip camera"
            onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}
            className="press flex flex-col items-center gap-1"
          >
            <RefreshCw
              className="size-6 text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]"
              strokeWidth={1.75}
            />
            <span className="text-[9px] font-medium text-white/90 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
              Flip
            </span>
          </button>
          <button
            aria-label={`Flash ${flash}`}
            onClick={() => setFlash((f) => (f === "off" ? "on" : f === "on" ? "auto" : "off"))}
            className="press flex flex-col items-center gap-1"
          >
            <Zap
              className="size-6 text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]"
              strokeWidth={1.75}
              fill={flash === "off" ? "none" : "currentColor"}
            />
            <span className="text-[9px] font-medium text-white/90 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
              {flash === "off" ? "Flash" : flash === "on" ? "Flash" : "Auto"}
            </span>
          </button>
          <button
            aria-label={`Timer ${timerSecs === 0 ? "off" : `${timerSecs}s`}`}
            onClick={() => setTimerSecs((t) => (t === 0 ? 3 : t === 3 ? 10 : t === 10 ? 15 : 0))}
            className="press flex flex-col items-center gap-1"
          >
            <Timer
              className="size-6 text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]"
              strokeWidth={1.75}
            />
            <span className="text-[9px] font-medium text-white/90 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
              {timerSecs === 0 ? "Off" : `${timerSecs}s`}
            </span>
          </button>
          <button
            aria-label="Text tool"
            aria-pressed={textMode}
            onClick={() => setTextMode((v) => !v)}
            className="press flex flex-col items-center gap-1"
          >
            <Type
              className={`size-6 drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)] ${textMode ? "text-brand" : "text-white"}`}
              strokeWidth={1.75}
            />
            <span className="text-[9px] font-medium text-white/90 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
              Text
            </span>
          </button>
          <button
            aria-label="Music"
            onClick={() => setMusicOpen((v) => !v)}
            className="press flex max-w-12 flex-col items-center gap-1"
          >
            <Music
              className={`size-6 drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)] ${track ? "text-brand" : "text-white"}`}
              strokeWidth={1.75}
              fill={track ? "currentColor" : "none"}
            />
            <span className="max-w-12 truncate text-[9px] font-medium text-white/90 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
              {track ? track.title : "Music"}
            </span>
          </button>
        </div>
        {!ready && !error && (
          <div className="absolute inset-0 grid place-items-center">
            <Loader2 className="size-6 animate-spin text-media-foreground" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 grid place-items-center px-8 text-center">
            <p className="text-sm font-semibold text-media-foreground">{error}</p>
          </div>
        )}
        {recording && (
          <span className="absolute left-4 top-4 rounded-full bg-live px-3 py-1 text-xs font-bold text-white">
            {String(Math.floor(seconds / 60)).padStart(2, "0")}:
            {String(seconds % 60).padStart(2, "0")} / 01:00
          </span>
        )}
      </div>

      <div className="space-y-3 bg-media px-4 pb-safe pt-3">
        {textMode && (
          <div className="animate-fade-up">
            <input
              value={overlayText}
              onChange={(e) => setOverlayText(e.target.value)}
              placeholder="Add text to your photo…"
              maxLength={80}
              className="w-full rounded-xl border border-white/20 bg-scrim px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/50"
            />
          </div>
        )}
        {musicOpen && (
          <div className="animate-fade-up max-h-40 overflow-y-auto rounded-2xl border border-white/10 bg-scrim">
            {TRACKS.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTrackId(trackId === t.id ? null : t.id);
                  setMusicOpen(false);
                }}
                className="flex w-full items-center gap-3 px-3 py-2 text-left"
              >
                <Music
                  className={`size-4 shrink-0 ${trackId === t.id ? "text-brand" : "text-white/70"}`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold text-white">{t.title}</span>
                  <span className="block truncate text-[11px] text-white/60">
                    {t.creator} · {t.duration}
                  </span>
                </span>
                {trackId === t.id && <span className="text-xs font-bold text-brand">Added</span>}
              </button>
            ))}
          </div>
        )}
        <div className="rail flex gap-2 overflow-x-auto pb-1">
          {filterPresets.map((p) => {
            const active = !useCustom && p.id === preset.id;
            return (
              <button
                key={p.id}
                onClick={() => {
                  setUseCustom(false);
                  setPreset(p);
                }}
                className={
                  active
                    ? "shrink-0 rounded-full bg-brand px-4 py-1.5 text-xs font-bold text-brand-foreground"
                    : "shrink-0 rounded-full bg-scrim px-4 py-1.5 text-xs font-medium text-media-foreground"
                }
              >
                {p.label}
              </button>
            );
          })}
          <button
            onClick={() => setUseCustom(true)}
            className={
              useCustom
                ? "shrink-0 rounded-full bg-brand px-4 py-1.5 text-xs font-bold text-brand-foreground"
                : "shrink-0 rounded-full bg-scrim px-4 py-1.5 text-xs font-medium text-media-foreground"
            }
          >
            Custom
          </button>
        </div>

        {useCustom ? (
          <div className="space-y-2">
            {(
              [
                ["smooth", "Skin smoothing", 0, 100],
                ["glow", "Glow", 0, 100],
                ["warmth", "Warmth", -100, 100],
              ] as const
            ).map(([key, label, min, max]) => (
              <label key={key} className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-[11px] text-media-foreground/80">{label}</span>
                <input
                  type="range"
                  min={min}
                  max={max}
                  value={custom[key]}
                  onChange={(e) => setCustom((c) => ({ ...c, [key]: Number(e.target.value) }))}
                  className="w-full accent-[hsl(var(--brand))]"
                />
              </label>
            ))}
          </div>
        ) : (
          <label className="flex items-center gap-3">
            <span className="w-28 shrink-0 text-[11px] text-media-foreground/80">Intensity</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(strength * 100)}
              onChange={(e) => setStrength(Number(e.target.value) / 100)}
              className="w-full accent-[hsl(var(--brand))]"
            />
          </label>
        )}

        <div className="flex items-center justify-center py-2">
          {mode === "photo" && (
            <button
              aria-label="Take photo"
              disabled={!ready || busy}
              onClick={takePhoto}
              className="grid size-16 place-items-center rounded-full bg-brand shadow-create disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="size-6 animate-spin text-white" />
              ) : (
                <Camera className="size-7 text-white" />
              )}
            </button>
          )}

          {mode === "short" && (
            <button
              aria-label={recording ? "Stop recording" : "Start recording"}
              disabled={!ready}
              onClick={recording ? stopRecording : startRecording}
              className="grid size-16 place-items-center rounded-full bg-live shadow-create disabled:opacity-50"
            >
              {recording ? (
                <Square className="size-6 text-white" fill="currentColor" />
              ) : (
                <span className="size-6 rounded-full bg-white" />
              )}
            </button>
          )}

          {mode === "live" && (
            <div className="flex flex-col items-center gap-2">
              <button
                disabled={!ready}
                className="flex items-center gap-2 rounded-full bg-live px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                <Radio className="size-4" /> Go live
              </button>
              <span className="text-[11px] text-media-foreground/70">
                Live streaming opens soon — your filter is saved for it.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
